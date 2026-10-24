import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { Globe, Mic, MicOff, Volume2, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentLang: string;
  onSelectLanguage: (code: string) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  user: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenOfficerPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLanguage,
  isVoiceActive,
  onToggleVoice,
  user,
  onLogout,
  onNavigateHome,
  onOpenOfficerPortal
}) => {
  const { t } = useTranslation();

  return (
    <header className="border-b border-gov-border bg-white sticky top-0 z-40 shadow-sm">
      {/* Indian National Tricolor Decorative Top Band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#128807]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Portal Identity */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center space-x-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Vridhi-ID Home"
        >
          <div className="w-12 h-12 rounded-xl bg-gov-navy text-white flex items-center justify-center font-bold text-2xl shadow-inner group-hover:bg-gov-blue transition">
            वि
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-gov-navy">
                {t('brandName')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                {t('demoBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              {t('portalSubtitle')}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          {/* Voice Assistance Quick Switch */}
          <button
            onClick={onToggleVoice}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition border ${
              isVoiceActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200 animate-pulse' 
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle Voice Assistance"
            aria-label="Toggle voice guidance"
          >
            {isVoiceActive ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            <span className="hidden md:inline">{t('nav.voiceAssistance')}</span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 hover:border-slate-400 transition">
            <Globe className="w-4 h-4 text-slate-500 mr-1.5" />
            <select
              value={currentLang}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Select portal language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Officer Portal Shortcut */}
          <button
            onClick={onOpenOfficerPortal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-sm"
            title="Human Officer Portal"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden lg:inline">{t('nav.officerPortal')}</span>
          </button>

          {/* User Status / Logout */}
          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-gov-navy px-2 py-1 bg-slate-100 rounded">
                +91 {user.mobile.slice(-4)}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
