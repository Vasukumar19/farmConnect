import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translation.js';
import translationService from '../services/translationService.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [currentTranslations, setCurrentTranslations] = useState(translations.en);
  const [isLoading, setIsLoading] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('freshconnect_language') || 'en';
    setLanguage(savedLang);
  }, []);

  // Update translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      console.log('🌍 Changing language to:', language);

      if (language === 'en') {
        setCurrentTranslations(translations.en);
        console.log('✅ Using English translations');
        return;
      }

      setIsLoading(true);
      const enKeys = Object.keys(translations.en);

      try {
        // Only use cache if ALL English keys are present
        if (
          translations[language] &&
          enKeys.every(key => translations[language][key])
        ) {
          console.log('✅ Using complete cached translations for', language);
          setCurrentTranslations(translations[language]);
          setIsLoading(false);
          return;
        }

        // If missing, batch translate missing keys only
        const keysToTranslate = enKeys.filter(
          key => !translations[language]?.[key]
        );
        if (keysToTranslate.length > 0) {
          console.log(`🚩 Translating ${keysToTranslate.length} missing keys`);
          let partialEn = {};
          keysToTranslate.forEach(key => {
            partialEn[key] = translations.en[key];
          });

          const newTranslations = await translationService.translateObject(
            partialEn,
            language
          );
          translations[language] = {
            ...translations[language],
            ...newTranslations,
          };
        }
        setCurrentTranslations(translations[language]);
        console.log('✅ All keys translated and updated for', language);
      } catch (error) {
        console.error('❌ Error loading translations:', error);
        setCurrentTranslations(translations.en);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const changeLanguage = (lang) => {
    console.log('🔄 Language change requested:', lang);
    setLanguage(lang);
    localStorage.setItem('freshconnect_language', lang);
  };

  const t = (key) => {
    const translation = currentTranslations[key];
    if (!translation) {
      console.warn(`⚠️ Missing translation key: ${key}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        isLoading,
        currentTranslations,
        availableLanguages: [
          { code: 'en', name: 'English', flag: '🇺🇸' },
          { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
          { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
        ]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
