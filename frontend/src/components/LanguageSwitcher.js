import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, changeLanguage, isLoading, availableLanguages } = useLanguage();

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      alignItems: 'center'
    }}>
      {availableLanguages.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          disabled={isLoading}
          title={lang.name}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: language === lang.code ? '2px solid white' : '1px solid rgba(255,255,255,0.4)',
            background: language === lang.code ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: language === lang.code ? '700' : '500',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && language !== lang.code) {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (language !== lang.code) {
              e.target.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>{lang.flag}</span>
          <span>{lang.code.toUpperCase()}</span>
        </button>
      ))}
      {isLoading && (
        <span style={{ 
          fontSize: '12px', 
          color: 'rgba(255,255,255,0.7)',
          marginLeft: '4px',
          animation: 'pulse 1.5s infinite'
        }}>
          ⟳
        </span>
      )}
    </div>
  );
}