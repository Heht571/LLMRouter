import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言文件
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';

const resources = {
  en: {
    translation: en
  },
  'zh-CN': {
    translation: zhCN
  },
  'zh-TW': {
    translation: zhTW
  },
  ja: {
    translation: ja
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    defaultNS: 'translation',
    fallbackNS: 'translation',
    ns: ['translation'],
    debug: false,
    keySeparator: '.',
    nsSeparator: ':',
    
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;