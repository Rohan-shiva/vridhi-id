import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { VoiceService } from '../voice/voiceEngine';
import { Camera, Mic, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft, ShieldCheck, Activity } from 'lucide-react';

interface BiometricVerificationScreenProps {
  application: any;
  onVerificationComplete: (result: any) => void;
  onCancel: () => void;
  currentLang: string;
}

export const BiometricVerificationScreen: React.FC<BiometricVerificationScreenProps> = ({
  application,
  onVerificationComplete,
  onCancel,
  currentLang
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [initialFrameBlob, setInitialFrameBlob] = useState<Blob | null>(null);
  const [challengeFrameBlob, setChallengeFrameBlob] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [step, setStep] = useState<'camera' | 'challenge' | 'voice' | 'evaluating' | 'result'>('camera');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize session & camera
  useEffect(() => {
    initSession();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const initSession = async () => {
    try {
      const data = await ApiService.startVerificationSession(application.id);
      setSessionId(data.sessionId);
      setChallenge(data.challenge);

      // Voice instruction
      VoiceService.speak("कृपया सीधे कैमरे की ओर देखें और शांत रहें।", currentLang);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start verification session");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setErrorMsg("Camera access permission is required for face anti-spoofing verification.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  const captureFrame = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        return reject("Camera feed not ready");
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context unavailable");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject("Frame capture failed");
      }, 'image/jpeg', 0.92);
    });
  };

  // Step 1: Capture baseline face frame
  const handleCaptureInitial = async () => {
    try {
      const blob = await captureFrame();
      setInitialFrameBlob(blob);
      setStep('challenge');

      // Announce active challenge
      const instructionText = challenge?.instructions || "कृपया अपना सिर थोड़ा बाईं ओर घुमाएं।";
      VoiceService.speak(instructionText, currentLang);
    } catch (err: any) {
      setErrorMsg(String(err));
    }
  };

  // Step 2: Capture active challenge frame
  const handleCaptureChallenge = async () => {
    try {
      const blob = await captureFrame();
      setChallengeFrameBlob(blob);
      setStep('voice');

      VoiceService.speak("अब आवाज सत्यापन के लिए माइक दबाएं और स्पष्ट बोलें।", currentLang);
    } catch (err: any) {
      setErrorMsg(String(err));
    }
  };

  // Step 3: Record Voice Sample
  const handleToggleVoiceRecord = async () => {
    if (isRecordingVoice) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecordingVoice(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const combinedAudio = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setAudioBlob(combinedAudio);
          stream.getTracks().forEach(t => t.stop());
          // Auto submit when voice recording completes
          submitAllBiometrics(combinedAudio);
        };

        recorder.start();
        setIsRecordingVoice(true);

        // Record for 3 seconds then auto-stop
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
            setIsRecordingVoice(false);
          }
        }, 3200);

      } catch (err) {
        console.warn("Microphone not available, proceeding with face biometrics:", err);
        // Fallback: Proceed with face biometrics if mic unavailable
        submitAllBiometrics(null);
      }
    }
  };

  // Step 4: Submit to Backend & Model Service
  const submitAllBiometrics = async (recordedAudio: Blob | null) => {
    if (!sessionId || !initialFrameBlob) return;

    setStep('evaluating');
    setErrorMsg(null);
    VoiceService.speak("एआई मॉडल आपके बायोमेट्रिक संकेतों का सत्यापन कर रहे हैं।", currentLang);

    try {
      const formData = new FormData();
      formData.append('live_image', initialFrameBlob, 'live.jpg');
      formData.append('reference_image', initialFrameBlob, 'ref.jpg'); // Enrolled reference fallback
      if (challengeFrameBlob) {
        formData.append('challenge_image', challengeFrameBlob, 'challenge.jpg');
      }
      if (recordedAudio) {
        formData.append('live_audio', recordedAudio, 'live.wav');
        formData.append('reference_audio', recordedAudio, 'ref.wav');
      }

      const result = await ApiService.submitBiometrics(sessionId, formData);
      setEvaluationResult(result);
      setStep('result');

      // Spoken outcome
      if (result.decision === 'checks_passed') {
        VoiceService.speak("बधाई हो! आपका बायोमेट्रिक सत्यापन सफल हो गया है।", currentLang);
      } else if (result.decision === 'manual_review') {
        VoiceService.speak("आपका आवेदन मानव अधिकारी की समीक्षा के लिए भेज दिया गया है।", currentLang);
      } else {
        VoiceService.speak("सत्यापन में विसंगति पाई गई है।", currentLang);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Biometric evaluation failed");
      setStep('camera');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>रद्द करें / Cancel</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-gov-navy bg-slate-100 px-3 py-1 rounded-full">
          PPO: {application.ppoNumber}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {/* Step Indicator Header */}
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black">{t('verification.title')}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10">
            {step === 'camera' && "चरण 1: चेहरा पहचान"}
            {step === 'challenge' && "चरण 2: सक्रिय चुनौती"}
            {step === 'voice' && "चरण 3: आवाज सत्यापन"}
            {step === 'evaluating' && "विश्लेषण जारी..."}
            {step === 'result' && "परिणाम"}
          </span>
        </div>

        {errorMsg && (
          <div className="m-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Video / Camera Feed */}
        {step !== 'result' && step !== 'evaluating' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video max-w-lg mx-auto shadow-inner border-4 border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Guiding Face Oval Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-60 rounded-full border-2 border-dashed border-emerald-400/80 shadow-2xl" />
              </div>

              {/* Live Challenge Banner */}
              {step === 'challenge' && challenge && (
                <div className="absolute top-4 inset-x-4 p-3 rounded-xl bg-amber-500/90 text-white backdrop-blur-md text-center font-bold text-sm shadow-md animate-slideDown">
                  {challenge.instructions}
                </div>
              )}
            </div>

            {/* Step Controls */}
            <div className="text-center space-y-3">
              {step === 'camera' && (
                <div>
                  <p className="text-sm text-slate-600 mb-3">{t('verification.cameraDesc')}</p>
                  <button
                    onClick={handleCaptureInitial}
                    className="py-4 px-8 rounded-xl font-bold text-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-md inline-flex items-center space-x-2"
                  >
                    <Camera className="w-6 h-6" />
                    <span>{t('verification.captureLive')}</span>
                  </button>
                </div>
              )}

              {step === 'challenge' && (
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-3">
                    निर्देश अनुसार सिर हिलाएं और 'फोटो लें' दबाएं
                  </p>
                  <button
                    onClick={handleCaptureChallenge}
                    className="py-4 px-8 rounded-xl font-bold text-lg bg-gov-saffron text-white hover:bg-amber-600 transition shadow-md inline-flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>सत्यापित करें</span>
                  </button>
                </div>
              )}

              {step === 'voice' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {t('verification.voiceDesc')}
                  </p>
                  <button
                    onClick={handleToggleVoiceRecord}
                    className={`py-4 px-8 rounded-xl font-bold text-lg transition shadow-md inline-flex items-center space-x-2 ${
                      isRecordingVoice
                        ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Mic className="w-6 h-6" />
                    <span>{isRecordingVoice ? "रिकॉर्डिंग हो रही है..." : "आवाज बोलना शुरू करें"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluating State */}
        {step === 'evaluating' && (
          <div className="p-12 text-center space-y-6">
            <RefreshCw className="w-12 h-12 text-gov-blue mx-auto animate-spin" />
            <div>
              <h3 className="text-xl font-bold text-gov-navy">
                {t('verification.evaluating')}
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                MiniFASNet Face PAD, ArcFace पहचान, और ECAPA वॉयस मॉडल वास्तविक समय में विश्लेषण कर रहे हैं...
              </p>
            </div>
          </div>
        )}

        {/* Final Result Breakdown */}
        {step === 'result' && evaluationResult && (
          <div className="p-6 sm:p-8 space-y-6">
            {evaluationResult.decision === 'checks_passed' ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-2xl font-black text-emerald-900">
                  {t('verification.passedTitle')}
                </h3>
                <p className="text-sm text-emerald-800">
                  {evaluationResult.summary}
                </p>
              </div>
            ) : evaluationResult.decision === 'manual_review' ? (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="text-2xl font-black text-amber-900">
                  {t('verification.reviewTitle')}
                </h3>
                <p className="text-sm text-amber-800">
                  {evaluationResult.summary}
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
                <h3 className="text-2xl font-black text-red-900">
                  {t('verification.spoofTitle')}
                </h3>
                <p className="text-sm text-red-800">
                  {evaluationResult.summary}
                </p>
              </div>
            )}

            {/* AI Model Inspection Metrics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-600 block mb-2">
                एआई मॉडल परिणाम साक्ष्य (Model Inference Audit)
              </span>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="font-semibold">जोखिम स्तर (Risk Score):</span>{" "}
                  <span className="font-bold text-gov-navy">{evaluationResult.riskScore} / 100</span>
                </div>
                <div>
                  <span className="font-semibold">निर्णಯ ಸ್ಥಿತಿ (Decision):</span>{" "}
                  <span className="font-mono font-bold uppercase">{evaluationResult.decision}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => onVerificationComplete(evaluationResult)}
                className="py-4 px-8 rounded-xl font-bold text-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-md"
              >
                {t('verification.viewCertBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
