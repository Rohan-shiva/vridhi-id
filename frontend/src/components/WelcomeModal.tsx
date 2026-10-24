import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../i18n/languages';
import { VoiceService, RecognizedCommand } from '../voice/voiceEngine';
import { Volume2, VolumeX, Globe, ArrowRight, Mic, CheckCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onDismiss: (chosenLang: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onDismiss }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<'greeting' | 'languageSelection'>('greeting');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');

  const HINDI_GREETING_TEXT = 
    "नमस्ते! वृद्धि-ID सहायता पोर्टल में आपका स्वागत है। " +
    "यह पोर्टल वरिष्ठ पेंशनभोगियों को डिजिटल जीवन प्रमाण पत्र बनाने में मदद करता है। " +
    "क्या आप भाषा बदलना चाहते हैं?";

  useEffect(() => {
    if (isOpen) {
      // Step 1: Default to Hindi
      i18n.changeLanguage('hi');

      // Step 2: Speak Hindi greeting automatically
      setIsSpeaking(true);
      VoiceService.speak(HINDI_GREETING_TEXT, 'hi', () => {
        setIsSpeaking(false);
        // Step 3: Listen for spoken answer ('हाँ' or 'नहीं')
        startVoiceListener();
      });
    }

    return () => {
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
    };
  }, [isOpen]);

  const startVoiceListener = () => {
    if (!VoiceService.isSpeechRecognitionSupported()) return;

    setIsListening(true);
    VoiceService.startListening(
      'hi',
      (cmd: RecognizedCommand) => {
        setIsListening(false);
        setVoiceFeedback(`सुना गया: "${cmd.rawText}"`);

        if (cmd.intent === 'YES') {
          // User said Yes -> Show language choices
          handleWantToChangeLanguage();
        } else if (cmd.intent === 'NO') {
          // User said No -> Keep Hindi and proceed
          handleKeepHindi();
        } else if (cmd.intent === 'SELECT_LANGUAGE' && cmd.matchedEntity) {
          // User directly spoke a language name e.g. "Kannada"
          handleSelectLanguage(cmd.matchedEntity);
        }
      },
      (err) => {
        setIsListening(false);
        console.log("[WelcomeVoice] Voice prompt listening timeout/handled:", err);
      },
      (listening) => setIsListening(listening)
    );
  };

  const handleWantToChangeLanguage = () => {
    setStep('languageSelection');
    VoiceService.stopSpeaking();
    VoiceService.stopListening();

    const announceText = "कृपया अपनी भाषा चुनें। ನೀವು ಕನ್ನಡ, தமிழ், తెలుగు, અથવા અન્ય ભાષા પસંદ કરી શકો છો.";
    setIsSpeaking(true);
    VoiceService.speak(announceText, 'hi', () => {
      setIsSpeaking(false);
      // Listen for language names
      listenForLanguageChoice();
    });
  };

  const listenForLanguageChoice = () => {
    if (!VoiceService.isSpeechRecognitionSupported()) return;

    setIsListening(true);
    VoiceService.startListening(
      'hi',
      (cmd: RecognizedCommand) => {
        setIsListening(false);
        if (cmd.intent === 'SELECT_LANGUAGE' && cmd.matchedEntity) {
          handleSelectLanguage(cmd.matchedEntity);
        }
      },
      () => setIsListening(false),
      (listening) => setIsListening(listening)
    );
  };

  const handleKeepHindi = () => {
    VoiceService.stopSpeaking();
    VoiceService.stopListening();
    i18n.changeLanguage('hi');
    localStorage.setItem('vridhi_language', 'hi');
    onDismiss('hi');
  };

  const handleSelectLanguage = (langCode: string) => {
    VoiceService.stopSpeaking();
    VoiceService.stopListening();

    const selected = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];
    i18n.changeLanguage(langCode);
    localStorage.setItem('vridhi_language', langCode);

    setVoiceFeedback(`चयनित: ${selected.nativeName} (${selected.name})`);

    // Voice confirmation in chosen language
    const confirmationText = `${selected.nativeName} चुनी गई। आगे बढ़ रहे हैं।`;
    setIsSpeaking(true);
    VoiceService.speak(confirmationText, langCode, () => {
      setIsSpeaking(false);
      onDismiss(langCode);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-4 border-gov-navy overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        {/* Top Header */}
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-gov-saffron flex items-center justify-center font-bold text-lg">
              वि
            </span>
            <h2 id="welcome-modal-title" className="text-xl font-bold tracking-tight">
              वृद्धि-ID (Vridhi-ID) | स्वागतम्
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {isSpeaking && (
              <span className="flex items-center text-xs text-amber-300 font-semibold animate-pulse">
                <Volume2 className="w-4 h-4 mr-1" /> बोल रहा है...
              </span>
            )}
            {isListening && (
              <span className="flex items-center text-xs text-emerald-300 font-semibold animate-pulse">
                <Mic className="w-4 h-4 mr-1" /> सुन रहा है...
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {step === 'greeting' ? (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-700 text-3xl shadow-inner">
                🙏
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gov-navy leading-snug">
                  नमस्ते! वृद्धि-ID सहायता पोर्टल में आपका स्वागत है।
                </h3>
                <p className="mt-3 text-slate-700 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
                  यह पोर्टल वरिष्ठ नागरिकों एवं पेंशनभोगियों के लिए डिजिटल जीवन प्रमाण पत्र प्रक्रिया को सरल, आवाज-सहायित और सुरक्षित बनाता है।
                </p>
              </div>

              {/* Spoken question card */}
              <div className="p-5 rounded-xl bg-slate-50 border-2 border-gov-blue/20 text-gov-navy">
                <p className="font-bold text-lg text-gov-navy">
                  क्या आप भाषा बदलना चाहते हैं?
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  (आप सीधे 'हाँ' या 'नहीं' बोल सकते हैं, या नीचे दिए गए विकल्पों को छू सकते हैं)
                </p>

                {voiceFeedback && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded inline-block">
                    {voiceFeedback}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleKeepHindi}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-md flex items-center justify-center space-x-2 border-2 border-gov-navy"
                >
                  <span>नहीं, हिन्दी में जारी रखें</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleWantToChangeLanguage}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gov-saffron text-white hover:bg-amber-600 transition shadow-md flex items-center justify-center space-x-2 border-2 border-amber-600"
                >
                  <Globe className="w-5 h-5" />
                  <span>हाँ, भाषा बदलें</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-extrabold text-gov-navy">
                  अपनी पसंदीदा भाषा चुनें / Select Language
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  भाषा का नाम बोलें या नीचे दिए गए कार्ड पर स्पर्श करें
                </p>
                {voiceFeedback && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded inline-block">
                    {voiceFeedback}
                  </p>
                )}
              </div>

              {/* Native Language Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-gov-navy hover:bg-slate-50 text-left transition flex flex-col justify-between group active:scale-95"
                  >
                    <span className="text-lg font-black text-gov-navy group-hover:text-gov-blue">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 mt-1">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
                <span>आप बाद में भी कभी भी भाषा बदल सकते हैं।</span>
                <button
                  onClick={handleKeepHindi}
                  className="font-bold text-gov-navy hover:underline"
                >
                  हिन्दी में जारी रखें
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
