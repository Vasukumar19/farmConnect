import axios from 'axios';

const CACHE_KEY = 'freshconnect_translations_cache';
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

class TranslationService {
  constructor() {
    this.cache = this.loadCache();
    this.pendingRequests = {};
    this.retryCount = {};
  }

  loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
          console.log('✅ Loaded translation cache from localStorage');
          return parsed.data || {};
        }
      }
    } catch (err) {
      console.error('❌ Error loading cache:', err);
    }
    return {};
  }

  saveCache() {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: this.cache,
          timestamp: Date.now(),
        })
      );
      console.log('✅ Saved translation cache to localStorage');
    } catch (err) {
      console.error('❌ Error saving cache:', err);
    }
  }

  async translateBatch(texts, targetLang) {
    if (targetLang === 'en') return texts;

    console.log(`🔄 Translating batch to ${targetLang}:`, texts.length, 'items');

    // Check cache first
    const toTranslate = texts.filter(
      (text) => !this.cache[`${targetLang}_${text}`]
    );

    if (toTranslate.length === 0) {
      console.log('✅ All texts found in cache');
      return texts.map((text) => this.cache[`${targetLang}_${text}`] || text);
    }

    console.log(`📝 Need to translate ${toTranslate.length} new texts`);

    // Remove duplicates
    const uniqueTexts = [...new Set(toTranslate)];
    const batchSize = 50; // Larger batches for efficiency

    for (let i = 0; i < uniqueTexts.length; i += batchSize) {
      const batch = uniqueTexts.slice(i, i + batchSize);
      const batchKey = batch.join('|||');

      // Wait if this batch is already being processed
      if (this.pendingRequests[batchKey]) {
        console.log('⏳ Waiting for batch that is already being processed...');
        await this.pendingRequests[batchKey];
      } else {
        // Process this batch
        this.pendingRequests[batchKey] = this.fetchTranslations(batch, targetLang)
          .then((translated) => {
            console.log(`✅ Batch translated (${targetLang}):`, translated.length, 'items');
            batch.forEach((text, idx) => {
              const key = `${targetLang}_${text}`;
              this.cache[key] = translated[idx] || text;
            });
            delete this.pendingRequests[batchKey];
          })
          .catch((err) => {
            console.error('❌ Batch translation failed:', err);
            delete this.pendingRequests[batchKey];
          });

        await this.pendingRequests[batchKey];
      }
    }

    this.saveCache();

    return texts.map((text) => this.cache[`${targetLang}_${text}`] || text);
  }

  async fetchTranslations(texts, targetLang) {
    try {
      console.log(`🌐 Calling translation API for ${targetLang}...`);

      // Using Google Translate Free API (no authentication required)
      const promises = texts.map((text) =>
        this.translateText(text, targetLang)
      );

      const translated = await Promise.all(promises);
      return translated;
    } catch (err) {
      console.error('❌ Translation API error:', err.message);
      throw err;
    }
  }

  async translateText(text, targetLang) {
    try {
      // Using MyMemory Translation API (completely free, no auth needed)
      const langMap = {
        hi: 'hi',
        te: 'te',
      };

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|${langMap[targetLang]}`;

      console.log(`📡 Translating: "${text}" to ${targetLang}`);

      const response = await axios.get(url, {
        timeout: 10000,
      });

      if (response.data?.responseStatus === 200) {
        const translatedText = response.data.responseData.translatedText;
        console.log(`✅ "${text}" → "${translatedText}"`);
        return translatedText;
      } else {
        console.warn(`⚠️ API returned status ${response.data?.responseStatus}`);
        return text;
      }
    } catch (err) {
      console.error(`❌ Translation failed for "${text}":`, err.message);
      return text;
    }
  }

  async translateObject(obj, targetLang) {
    if (targetLang === 'en') return obj;

    console.log(`📦 Translating entire object to ${targetLang}...`);
    const keys = Object.keys(obj);
    const values = Object.values(obj);

    console.log(`📊 Total keys to translate: ${values.length}`);

    const translatedValues = await this.translateBatch(values, targetLang);

    const result = {};
    keys.forEach((key, idx) => {
      result[key] = translatedValues[idx] || values[idx];
    });

    console.log(`✅ Object fully translated to ${targetLang}`);
    return result;
  }
}


const translationService = new TranslationService();
export default translationService;