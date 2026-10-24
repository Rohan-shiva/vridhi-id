import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { VoiceService, RecognizedCommand } from '../voice/voiceEngine';
import { Smartphone, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Mic, RotateCcw } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
  currentLang: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, currentLang }) => {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleaned = mobile.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      setError(t('auth.mobileLabel'));
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.requestOtp(cleaned);
      setOtpSent(true);
      setCooldown(data.cooldownSeconds || 60);
      if (data.testOtp) {
        setTestOtp(data.testOtp);
      }
      setSuccessMsg(t('auth.otpSent'));

      // Speak OTP prompt
      VoiceService.speak("ओटीपी आपके मोबाइल पर भेजा गया है। कृपया 6 अंकों का ओटीपी दर्ज करें।", currentLang);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError(t('auth.otpLabel'));
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.verifyOtp(mobile, otp, currentLang);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 p-6 sm:p-8 bg-white rounded-2xl shadow-xl border-2 border-slate-200">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gov-navy/10 text-gov-navy flex items-center justify-center mb-3">
          <Smartphone className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-gov-navy">
          {t('auth.title')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t('auth.subtitle')}
        </p>
      </div>

      {/* Test Mode Banner */}
      {testOtp && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
          <span className="font-bold">{t('auth.testOtpNotice')} </span>
          <span className="font-mono text-sm tracking-widest font-black bg-white px-2 py-0.5 rounded border border-amber-400">
            {testOtp}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {!otpSent ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gov-navy mb-1.5">
              {t('auth.mobileLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-500">
                +91
              </span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t('auth.mobilePlaceholder')}
                maxLength={10}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-gov-navy focus:outline-none text-lg font-bold text-gov-navy tracking-wider"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? "..." : t('auth.requestOtp')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-gov-navy">
                {t('auth.otpLabel')}
              </label>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-xs font-semibold text-gov-blue hover:underline"
              >
                +91 {mobile} (बदलें)
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('auth.otpPlaceholder')}
                maxLength={6}
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-gov-navy focus:outline-none text-2xl font-black text-center text-gov-navy tracking-widest font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gov-saffron text-white hover:bg-amber-600 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? "..." : t('auth.verifyOtp')}</span>
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <div className="text-center pt-2">
            {cooldown > 0 ? (
              <span className="text-xs text-slate-500 font-semibold">
                {t('auth.cooldownText', { seconds: cooldown })}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                className="text-xs font-bold text-gov-navy hover:underline flex items-center justify-center mx-auto space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('auth.resendOtp')}</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
