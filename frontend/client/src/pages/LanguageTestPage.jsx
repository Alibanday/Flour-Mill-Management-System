import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { FaGlobe, FaLanguage, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LanguageTestPage = () => {
  const { language, direction, changeLanguage, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
            {t('common.language')} {t('systemConfig.title')}
          </h1>
          <p className="text-gray-600 text-center">
            {language === 'en' 
              ? 'Test and configure language settings for your system' 
              : 'اپنے سسٹم کے لیے زبان کی ترتیبات کو ٹیسٹ اور کنفیگر کریں'
            }
          </p>
        </div>
        
        {/* Current Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaLanguage className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {language === 'en' ? 'Current Language Status' : 'موجودہ زبان کی حالت'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">{t('common.language')}:</span>
                <span className="font-semibold text-gray-800">{language.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Direction:</span>
                <span className="font-semibold text-gray-800">{direction.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Document Lang:</span>
                <span className="font-semibold text-gray-800">{document.documentElement.lang}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">RTL Mode:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  direction === 'rtl' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {direction === 'rtl' ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">English:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  language === 'en' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {language === 'en' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Urdu:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  language === 'ur' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {language === 'ur' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Language Controls Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaGlobe className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {language === 'en' ? 'Language Controls' : 'زبان کے کنٹرولز'}
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => changeLanguage('en')}
              className={`flex items-center justify-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                language === 'en' 
                  ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <span className="text-xl">🇺🇸</span>
              <span>English</span>
            </button>
            
            <button
              onClick={() => changeLanguage('ur')}
              className={`flex items-center justify-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                language === 'ur' 
                  ? 'bg-green-500 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <span className="text-xl">🇵🇰</span>
              <span>اردو</span>
            </button>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center space-x-3 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <FaGlobe className="w-4 h-4" />
              <span>{language === 'en' ? 'Toggle Language' : 'زبان تبدیل کریں'}</span>
            </button>
          </div>
        </div>

        {/* Translation Test Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaLanguage className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {language === 'en' ? 'Translation Test' : 'ترجمہ کا ٹیسٹ'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                {t('navigation.title') || 'Navigation'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Dashboard:</span>
                  <span className="font-semibold text-gray-800">{t('navigation.dashboard')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">User Management:</span>
                  <span className="font-semibold text-gray-800">{t('navigation.userManagement')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Reports:</span>
                  <span className="font-semibold text-gray-800">{t('navigation.reports')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Settings:</span>
                  <span className="font-semibold text-gray-800">{t('navigation.settings')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                {t('common.actions') || 'Common Actions'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Save:</span>
                  <span className="font-semibold text-gray-800">{t('common.save')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Cancel:</span>
                  <span className="font-semibold text-gray-800">{t('common.cancel')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Delete:</span>
                  <span className="font-semibold text-gray-800">{t('common.delete')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Edit:</span>
                  <span className="font-semibold text-gray-800">{t('common.edit')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-600">Loading:</span>
                  <span className="font-semibold text-gray-800">{t('common.loading')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RTL Test Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaGlobe className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {language === 'en' ? 'RTL Layout Test' : 'RTL لی آؤٹ ٹیسٹ'}
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 p-6 rounded-lg">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium text-gray-700">
                {language === 'en' 
                  ? 'This text should be left-aligned in English mode.' 
                  : 'یہ متن اردو موڈ میں دائیں جانب ہونا چاہیے۔'
                }
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'The direction should be LTR (left-to-right).' 
                  : 'سمت RTL (دائیں سے بائیں) ہونی چاہیے۔'
                }
              </p>
              <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  direction === 'rtl' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {direction === 'rtl' ? 'RTL Mode Active' : 'LTR Mode Active'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageTestPage;
