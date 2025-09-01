import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [direction, setDirection] = useState('ltr');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
    setDirection(savedLanguage === 'ur' ? 'rtl' : 'ltr');
    
    // Apply language to document
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === 'ur' ? 'rtl' : 'ltr';
  }, []);

  // Change language
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    setDirection(newLanguage === 'ur' ? 'rtl' : 'ltr');
    localStorage.setItem('language', newLanguage);
    
    // Apply language to document
    document.documentElement.lang = newLanguage;
    document.documentElement.dir = newLanguage === 'ur' ? 'rtl' : 'ltr';
  };

  // Toggle between English and Urdu
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ur' : 'en';
    changeLanguage(newLanguage);
  };

  // Get current language configuration
  const getLanguageConfig = () => {
    return {
      language,
      direction,
      isRTL: direction === 'rtl',
      isEnglish: language === 'en',
      isUrdu: language === 'ur'
    };
  };

  const value = {
    language,
    direction,
    changeLanguage,
    toggleLanguage,
    getLanguageConfig
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
