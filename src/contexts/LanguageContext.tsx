import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { translations } from '@/lib/translations';

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া' },
];

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Get translations for a language code using static imports
const getTranslationsForLanguage = (langCode: string): Record<string, string> => {
  try {
    const code = langCode.split('-')[0];
    return translations[code] || translations['en'] || {};
  } catch (error) {
    console.error('Translation loading error:', error);
    return {};
  }
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<string>(() => {
    // Initialize from localStorage synchronously to prevent flash
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_language') || 'en-IN';
    }
    return 'en-IN';
  });

  // Get translations synchronously using memoization
  const currentTranslations = useMemo(() => {
    return getTranslationsForLanguage(language);
  }, [language]);

  useEffect(() => {
    // Load from user profile if authenticated
    const loadUserLanguage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const userLang = (profile as any).language || 'en-IN';
            if (userLang !== language) {
              setLanguageState(userLang);
              localStorage.setItem('app_language', userLang);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user language:', error);
      }
    };

    loadUserLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);

    // Update user profile if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: lang } as any)
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to update user language:', error);
    }
  };

  const t = (key: string): string => {
    return currentTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
