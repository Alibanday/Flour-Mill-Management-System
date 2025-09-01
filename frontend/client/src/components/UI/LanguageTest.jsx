import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageTest = () => {
  const { t } = useTranslation();
  const { language, direction, isRTL } = useLanguage();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {t('common.language')} Test
      </h3>
      
      <div className="space-y-2">
        <p><strong>Current Language:</strong> {language}</p>
        <p><strong>Direction:</strong> {direction}</p>
        <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
        
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Sample Translations:</h4>
          <ul className="space-y-1 text-sm">
            <li><strong>Dashboard:</strong> {t('navigation.dashboard')}</li>
            <li><strong>User Management:</strong> {t('navigation.userManagement')}</li>
            <li><strong>Save:</strong> {t('common.save')}</li>
            <li><strong>Cancel:</strong> {t('common.cancel')}</li>
            <li><strong>Loading:</strong> {t('common.loading')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LanguageTest;
