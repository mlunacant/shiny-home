import { createContext, useContext } from 'react'
import { en } from './en'
import { es } from './es'

export type Language = 'en' | 'es'

export const translations = {
  en,
  es,
}

export type TranslationType = typeof en

export const I18nContext = createContext<{
  lang: Language
  t: TranslationType
  setLang: (lang: Language) => void
}>({
  lang: 'en',
  t: en,
  setLang: () => {},
})

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'es' ? 'es' : 'en'
}

export const replaceParams = (text: string, params?: Record<string, string | number>) => {
  if (!params) return text
  
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(`{{${key}}}`, String(value))
  }, text)
} 