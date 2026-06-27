import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import kh from './locales/kh.json'

const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language.startsWith('km') ? 'kh' : navigator.language.split('-')[0]
const locale = ['en', 'kh'].includes(savedLocale) ? savedLocale : browserLocale

const i18n = createI18n({
  legacy: false,
  locale: ['en', 'kh'].includes(locale) ? locale : 'en',
  fallbackLocale: 'en',
  messages: { en, kh },
})

export default i18n
