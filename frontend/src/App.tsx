import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { WelcomeModal } from './components/WelcomeModal';
import { VoiceAssistantBar } from './components/VoiceAssistantBar';
import { AuthScreen } from './components/AuthScreen';
import { PensionerDashboard } from './components/PensionerDashboard';
import { PensionFormModal } from './components/PensionFormModal';
import { BiometricVerificationScreen } from './components/BiometricVerificationScreen';
import { CertificateViewModal } from './components/CertificateViewModal';
import { OfficerDashboard } from './components/OfficerDashboard';
import { VoiceService, RecognizedCommand } from './voice/voiceEngine';
import { ApiService } from './services/api';

export function App() {
  const { t, i18n } = useTranslation();

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() => {
    return !!localStorage.getItem('vridhi_has_seen_welcome');
  });

  const [user, setUser] = useState<any>(null);
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'verification' | 'officer'>('dashboard');

  const [currentAppForVerification, setCurrentAppForVerification] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [certModalAppId, setCertModalAppId] = useState<string | null>(null);

  // Voice state
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Initial user check
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    const token = localStorage.getItem('vridhi_token');
    if (token) {
      try {
        const data = await ApiService.getMe();
        setUser(data.user);
        if (data.user?.languagePreference) {
          i18n.changeLanguage(data.user.languagePreference);
        }
      } catch (e) {
        localStorage.removeItem('vridhi_token');
        setUser(null);
      }
    }
  };

  const handleDismissWelcome = (chosenLang: string) => {
    setHasSeenWelcome(true);
    localStorage.setItem('vridhi_has_seen_welcome', 'true');
    i18n.changeLanguage(chosenLang);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('vridhi_language', langCode);
    if (user) {
      ApiService.updateLanguage(langCode).catch(console.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vridhi_token');
    setUser(null);
    setActiveScreen('dashboard');
    VoiceService.speak("सफलतापूर्वक लॉग आउट किया गया।", i18n.language);
  };

  // Voice toggle
  const handleToggleVoice = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
    } else {
      startVoiceInteraction();
    }
  };

  const startVoiceInteraction = () => {
    if (!VoiceService.isSpeechRecognitionSupported()) return;

    setIsListening(true);
    VoiceService.startListening(
      i18n.language,
      (cmd: RecognizedCommand) => {
        setIsListening(false);
        setVoiceTranscript(`पहचाना गया: ${cmd.rawText}`);

        if (cmd.intent === 'GENERATE_CERTIFICATE') {
          setIsFormModalOpen(true);
        } else if (cmd.intent === 'DOWNLOAD_CERTIFICATE') {
          // Open download
          setCertModalAppId(user?.id || 'demo');
        } else if (cmd.intent === 'GO_BACK') {
          setActiveScreen('dashboard');
        }
      },
      (err) => {
        setIsListening(false);
        console.warn("Voice assistant error/timeout:", err);
      },
      (listening) => setIsListening(listening)
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans">
      {/* Welcome Experience (Opens first-time in Hindi) */}
      <WelcomeModal
        isOpen={!hasSeenWelcome}
        onDismiss={handleDismissWelcome}
      />

      {/* Main App Bar */}
      <div>
        <Header
          currentLang={i18n.language}
          onSelectLanguage={handleLanguageChange}
          isVoiceActive={isVoiceActive}
          onToggleVoice={handleToggleVoice}
          user={user}
          onLogout={handleLogout}
          onNavigateHome={() => setActiveScreen('dashboard')}
          onOpenOfficerPortal={() => setActiveScreen('officer')}
        />

        {/* Dynamic Screen Container */}
        <main className="pb-28">
          {!user ? (
            <AuthScreen
              onLoginSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                setActiveScreen('dashboard');
              }}
              currentLang={i18n.language}
            />
          ) : activeScreen === 'officer' ? (
            <OfficerDashboard
              onBack={() => setActiveScreen('dashboard')}
            />
          ) : activeScreen === 'verification' && currentAppForVerification ? (
            <BiometricVerificationScreen
              application={currentAppForVerification}
              currentLang={i18n.language}
              onCancel={() => setActiveScreen('dashboard')}
              onVerificationComplete={(result) => {
                if (result.decision === 'checks_passed') {
                  setCertModalAppId(currentAppForVerification.id);
                }
                setActiveScreen('dashboard');
              }}
            />
          ) : (
            <PensionerDashboard
              user={user}
              currentLang={i18n.language}
              onStartApplication={() => setIsFormModalOpen(true)}
              onOpenDownload={(appId) => setCertModalAppId(appId || 'demo')}
            />
          )}
        </main>
      </div>

      {/* Pension Application Registration Modal */}
      <PensionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={(newApp) => {
          setIsFormModalOpen(false);
          setCurrentAppForVerification(newApp);
          setActiveScreen('verification');
        }}
      />

      {/* Certificate View & Download Modal */}
      {certModalAppId && (
        <CertificateViewModal
          isOpen={true}
          onClose={() => setCertModalAppId(null)}
          applicationId={certModalAppId}
        />
      )}

      {/* Persistent Accessible Voice Assistant Bar */}
      <VoiceAssistantBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        transcript={voiceTranscript}
        onToggleListen={handleToggleVoice}
        onRepeat={() => {
          VoiceService.speak(t('welcome.greeting'), i18n.language);
        }}
        onStopSpeaking={() => {
          VoiceService.stopSpeaking();
          setIsSpeaking(false);
        }}
      />

      {/* Government-Inspired Accessible Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">
          Vridhi-ID (वृद्धि-ID) • Voice-First, Multilingual Digital Life Certificate Assistance Platform
        </p>
        <p className="max-w-2xl mx-auto text-slate-400">
          {t('officialNotice')}
        </p>
        <div className="flex justify-center space-x-4 pt-1 text-[11px] text-gov-blue">
          <button onClick={() => setHasSeenWelcome(false)} className="hover:underline">
            भाषा चयन पुनः प्रारंभ करें (Restart Welcome Experience)
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
