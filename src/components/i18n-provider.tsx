'use client'

import { useState, useEffect } from 'react'
import { I18nContext, Language, translations, getInitialLanguage } from '@/lib/i18n'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    const initialLang = getInitialLanguage()
    setLang(initialLang)
  }, [])

  return (
    <I18nContext.Provider value={{ 
      lang, 
      t: translations[lang],
      setLang,
    }}>
      {children}
    </I18nContext.Provider>
  )
} 