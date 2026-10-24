export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  speechLocale: string;
  voiceKeywords: string[];
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechLocale: 'hi-IN',
    voiceKeywords: ['hindi', 'हिन्दी', 'हिंदी']
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechLocale: 'kn-IN',
    voiceKeywords: ['kannada', 'ಕನ್ನಡ', 'कन्नड़']
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechLocale: 'ta-IN',
    voiceKeywords: ['tamil', 'தமிழ்', 'तमिल']
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechLocale: 'te-IN',
    voiceKeywords: ['telugu', 'తెలుగు', 'तेलुगु']
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechLocale: 'bn-IN',
    voiceKeywords: ['bengali', 'বাংলা', 'बंगाली']
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechLocale: 'mr-IN',
    voiceKeywords: ['marathi', 'मराठी', 'मराठी']
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechLocale: 'gu-IN',
    voiceKeywords: ['gujarati', 'ગુજરાતી', 'गुजराती']
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechLocale: 'pa-IN',
    voiceKeywords: ['punjabi', 'ਪੰਜਾਬੀ', 'पंजाबी']
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechLocale: 'ml-IN',
    voiceKeywords: ['malayalam', 'മലയാളം', 'मलयालम']
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    speechLocale: 'or-IN',
    voiceKeywords: ['odia', 'orriya', 'ଓଡ଼ିଆ', 'उड़िया']
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechLocale: 'en-IN',
    voiceKeywords: ['english', 'अंग्रेजी', 'ಆಂಗ್ಲ']
  }
];

export const DEFAULT_LANGUAGE = 'hi';
