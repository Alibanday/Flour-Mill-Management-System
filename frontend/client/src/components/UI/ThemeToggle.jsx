import React from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, changeTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: FaSun },
    { value: 'dark', label: 'Dark', icon: FaMoon },
    { value: 'auto', label: 'Auto', icon: FaDesktop }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">Theme:</span>
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => changeTheme(themeOption.value)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={`Switch to ${themeOption.label} theme`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{themeOption.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;
