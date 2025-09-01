import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../services/translationService';

export const useTranslation = () => {
  const { language } = useLanguage();

  const translate = (key) => {
    return t(key, language);
  };

  const translateWithFallback = (key, fallback) => {
    const translation = t(key, language);
    return translation === key ? fallback : translation;
  };

  return {
    t: translate,
    translate,
    translateWithFallback,
    language
  };
};
