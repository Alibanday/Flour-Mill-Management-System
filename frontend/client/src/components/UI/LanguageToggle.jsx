import React from 'react';
import { FaGlobe, FaLanguage } from 'react-icons/fa';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, changeLanguage, toggleLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰', nativeName: 'اردو' }
  ];

  return (
    <div className="flex items-center space-x-3">
      {/* Language Label */}
      <div className="flex items-center space-x-2">
        <FaLanguage className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'en' ? 'Language' : 'زبان'}
        </span>
      </div>

      {/* Language Selector */}
      <div className="relative">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={`Switch to ${lang.nativeName}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="hidden sm:inline font-medium">{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Toggle Button */}
      <button
        onClick={toggleLanguage}
        className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
        title={language === 'en' ? 'Toggle Language' : 'زبان تبدیل کریں'}
      >
        <FaGlobe className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LanguageToggle;
