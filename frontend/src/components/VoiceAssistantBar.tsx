import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, RotateCcw, Square } from 'lucide-react';

interface VoiceAssistantBarProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onToggleListen: () => void;
  onRepeat: () => void;
  onStopSpeaking: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  isListening,
  isSpeaking,
  transcript,
  onToggleListen,
  onRepeat,
  onStopSpeaking
}) => {
  const { t } = useTranslation();

  return (
    <aside 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-gov-navy/20 p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp"
      aria-label="Voice Assistant Controls"
    >
      {/* Mic trigger and status */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleListen}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition shadow-md ${
            isListening 
              ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
              : 'bg-gov-navy text-white hover:bg-gov-blue'
          }`}
          title={isListening ? "Listening... click to stop" : "Click to speak voice command"}
          aria-label={isListening ? "Listening" : "Speak voice command"}
        >
          {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
        </button>

        <div className="overflow-hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-navy">
              {isListening 
                ? t('voiceAssistant.listening') 
                : isSpeaking 
                  ? t('voiceAssistant.speaking') 
                  : t('voiceAssistant.idle')}
            </span>
            {isSpeaking && <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
          </div>
          <p className="text-xs text-slate-600 truncate max-w-xs sm:max-w-md font-medium">
            {transcript || t('welcome.voiceHint')}
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Repeat button */}
        <button
          onClick={onRepeat}
          className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-gov-navy border border-slate-200 transition"
          title={t('voiceAssistant.repeatPrompt')}
          aria-label={t('voiceAssistant.repeatPrompt')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Stop speech button */}
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="p-2.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
            title={t('voiceAssistant.stopSpeaking')}
            aria-label={t('voiceAssistant.stopSpeaking')}
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>
    </aside>
  );
};
