import { SUPPORTED_LANGUAGES, LanguageInfo } from '../i18n/languages';

// Type definitions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type VoiceIntent = 
  | 'YES'
  | 'NO'
  | 'CHANGE_LANGUAGE'
  | 'SELECT_LANGUAGE'
  | 'GENERATE_CERTIFICATE'
  | 'DOWNLOAD_CERTIFICATE'
  | 'GO_BACK'
  | 'REPEAT'
  | 'UNKNOWN';

export interface RecognizedCommand {
  intent: VoiceIntent;
  rawText: string;
  matchedEntity?: string;
}

const YES_PHRASES = [
  'हाँ', 'हां', 'हा', 'haan', 'ha', 'yes', 'yah', 'yep', 'correct',
  'ಹೌದು', 'ಹೌದ', 'haudu',
  'ஆம்', 'ஆமாம்', 'aam',
  'అవును', 'avunu',
  'হ্যাঁ', 'হাঁ', 'hae',
  'हो', 'होय', 'hoy',
  'હા', 'haa',
  'ਹਾਂ', 'haanji',
  'അതെ', 'athe',
  'ହଁ', 'han'
];

const NO_PHRASES = [
  'नहीं', 'नही', 'ना', 'nahi', 'no', 'nope',
  'ಬೇಡ', 'ಇಲ್ಲ', 'beda', 'illa',
  'இல்லை', 'illai',
  'వద్దు', 'లేదు', 'vaddu', 'ledu',
  'না', 'na',
  'नाही', 'nahi',
  'ના', 'naa',
  'ਨਹੀਂ', 'nahi',
  'വേണ്ട', 'ഇല്ല', 'venda',
  'ନାହିଁ', 'nahi'
];

const BACK_PHRASES = [
  'पीछे', 'वापस', 'back', 'go back',
  'ಹಿಂದಕ್ಕೆ', 'hindakke',
  'பின்னால்', 'pinnāl',
  'వెనుకకు', 'venakaku',
  'পিছনে', 'pichone',
  'मागे', 'mage',
  'પાછળ', 'pāchaḷ',
  'ਪਿੱਛੇ', 'piche',
  'പുറകിലേക്ക്',
  'ପଛକୁ'
];

export class VoiceService {
  private static recognition: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  static speak(text: string, langCode: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn("[VoiceService] SpeechSynthesis unavailable in this browser");
        onEnd?.();
        resolve();
        return;
      }

      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];
      utterance.lang = langConfig.speechLocale;
      utterance.rate = 0.92; // Slightly measured pace for elderly accessibility
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(langCode) || v.lang.startsWith(langConfig.speechLocale));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn("[VoiceService] SpeechSynthesis playback error:", e);
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  static startListening(
    langCode: string,
    onResult: (cmd: RecognizedCommand) => void,
    onError: (err: string) => void,
    onStatusChange?: (isListening: boolean) => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError("Speech recognition is not supported in this browser environment.");
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.stopListening();

    try {
      this.recognition = new SpeechRec();
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];
      this.recognition.lang = langConfig.speechLocale;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        onStatusChange?.(true);
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        const command = this.parseCommand(transcript);
        onResult(command);
      };

      this.recognition.onerror = (event: any) => {
        console.warn("[VoiceService] Recognition error:", event.error);
        onError(event.error);
        onStatusChange?.(false);
      };

      this.recognition.onend = () => {
        onStatusChange?.(false);
      };

      this.recognition.start();
    } catch (err: any) {
      onError(err.message);
      onStatusChange?.(false);
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
  }

  static parseCommand(text: string): RecognizedCommand {
    const lower = text.toLowerCase().trim();

    // 1. Check for YES
    if (YES_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()))) {
      return { intent: 'YES', rawText: text };
    }

    // 2. Check for NO
    if (NO_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()))) {
      return { intent: 'NO', rawText: text };
    }

    // 3. Check for Back
    if (BACK_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()))) {
      return { intent: 'GO_BACK', rawText: text };
    }

    // 4. Check for Language Selection matches
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.voiceKeywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return { intent: 'SELECT_LANGUAGE', rawText: text, matchedEntity: lang.code };
      }
    }

    // 5. General intent matches
    if (lower.includes('प्रमाण पत्र') || lower.includes('certificate') || lower.includes('ಜನರೇಟ್') || lower.includes('बनाना')) {
      return { intent: 'GENERATE_CERTIFICATE', rawText: text };
    }

    if (lower.includes('डाउनलोड') || lower.includes('download') || lower.includes('ಡೌನ್‌ಲೋಡ್')) {
      return { intent: 'DOWNLOAD_CERTIFICATE', rawText: text };
    }

    return { intent: 'UNKNOWN', rawText: text };
  }
}
