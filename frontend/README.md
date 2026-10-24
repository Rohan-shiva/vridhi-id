# Vridhi-ID Frontend Application

Accessible, Voice-First, Multilingual web application built with React 18, TypeScript, Tailwind CSS, Vite, i18next, and the Web Speech API.

## Features

1. **Mandatory Hindi-First Welcome Flow**:
   - Opens in Hindi by default on first visit.
   - Real-time Text-to-Speech (TTS) Hindi announcement.
   - Spoken language prompt: "क्या आप भाषा बदलना चाहते हैं?" with dual voice and touch interaction.
2. **Complete 11-Language Multilingual Localization**:
   - Hindi (हिन्दी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Malayalam (മലയാളം), Odia (ଓଡ଼ିଆ), and English.
   - 100% key parity across all UI elements verified by automated test suites.
3. **Voice-First Navigation Engine**:
   - Web Speech API integration (`SpeechRecognition` & `SpeechSynthesis`).
   - Voice intent parser supporting natural variations in local languages.
4. **Accessible Biometric Presentation**:
   - Real-time webcam preview, face frame capture, microphone voice sample capture, and optical active challenge guidance.
5. **Officer Review Portal**:
   - Case review queue and decision recording.

## Development

```bash
npm install
npm test       # Run translation integrity test suite
npm run dev    # Start Vite dev server on http://localhost:3000
npm run build  # Production build
```
