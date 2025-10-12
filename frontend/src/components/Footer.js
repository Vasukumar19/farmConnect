import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="max-w-screen">
        <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          {t('footer.description')}
        </p>
      </div>
    </footer>
  );
}
