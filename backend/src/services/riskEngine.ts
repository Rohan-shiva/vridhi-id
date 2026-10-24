import { RiskOutcome } from '../models/types';

export interface EvaluationInput {
  facePad?: {
    prediction: string;
    liveProbability: number;
    spoofProbability: number;
    quality: {
      isSharp: boolean;
      isAdequatelyLit: boolean;
      faceDetected?: boolean;
    };
  };
  faceMatch?: {
    matched: boolean;
    similarityScore: number;
    threshold: number;
  };
  speakerVerify?: {
    verified: boolean;
    similarityScore: number;
    threshold: number;
  };
  audioSpoof?: {
    prediction: string;
    bonafideProbability: number;
    spoofProbability: number;
    anomalyFlags: string[];
  };
  activeChallenge?: {
    status: string;
    confidence: number;
  };
}

export interface RiskAssessmentResult {
  decision: RiskOutcome;
  riskScore: number; // 0 (safest) to 100 (highest risk)
  summary: string;
  flags: string[];
}

export class RiskEngine {
  static evaluate(inputs: EvaluationInput): RiskAssessmentResult {
    const flags: string[] = [];
    let riskScore = 15; // baseline

    // 1. Face Anti-Spoofing (PAD)
    if (inputs.facePad) {
      if (inputs.facePad.quality && !inputs.facePad.quality.isSharp) {
        flags.push("IMAGE_BLURRED");
        return {
          decision: 'retry_required',
          riskScore: 50,
          summary: "Camera frame is blurry. Please hold camera steady and retry.",
          flags
        };
      }
      if (inputs.facePad.quality && !inputs.facePad.quality.isAdequatelyLit) {
        flags.push("IMAGE_POOR_LIGHTING");
        return {
          decision: 'retry_required',
          riskScore: 50,
          summary: "Lighting is too dim or too bright. Please adjust lighting and retry.",
          flags
        };
      }
      if (inputs.facePad.spoofProbability > 0.65 || inputs.facePad.prediction === 'spoof') {
        flags.push("FACE_SPOOF_ATTACK_DETECTED");
        riskScore += 50;
      } else if (inputs.facePad.liveProbability < 0.50) {
        flags.push("FACE_LIVE_UNCERTAIN");
        riskScore += 25;
      }
    }

    // 2. Audio Spoofing Detection
    if (inputs.audioSpoof) {
      if (inputs.audioSpoof.spoofProbability > 0.65 || inputs.audioSpoof.prediction === 'spoof') {
        flags.push("SYNTHETIC_OR_REPLAY_VOICE_DETECTED");
        riskScore += 40;
      }
      if (inputs.audioSpoof.anomalyFlags && inputs.audioSpoof.anomalyFlags.length > 0) {
        flags.push(...inputs.audioSpoof.anomalyFlags);
      }
    }

    // Critical attack cutoff
    if (flags.includes("FACE_SPOOF_ATTACK_DETECTED") || flags.includes("SYNTHETIC_OR_REPLAY_VOICE_DETECTED")) {
      return {
        decision: 'suspected_spoof',
        riskScore: Math.min(100, riskScore + 30),
        summary: "Biometric presentation attack or synthetic spoof characteristics identified.",
        flags
      };
    }

    // 3. Face Match
    let faceMatchPassed = true;
    if (inputs.faceMatch) {
      if (!inputs.faceMatch.matched) {
        flags.push("FACE_MATCH_LOW_SIMILARITY");
        faceMatchPassed = false;
        riskScore += 35;
      }
    }

    // 4. Active Challenge
    let challengePassed = true;
    if (inputs.activeChallenge) {
      if (inputs.activeChallenge.status !== 'passed') {
        flags.push("ACTIVE_CHALLENGE_FAILED");
        challengePassed = false;
        riskScore += 20;
      }
    }

    // 5. Speaker Verification
    if (inputs.speakerVerify && !inputs.speakerVerify.verified) {
      flags.push("SPEAKER_VOICE_MISMATCH");
      riskScore += 25;
    }

    // Decision Logic
    if (faceMatchPassed && challengePassed && (!inputs.facePad || inputs.facePad.prediction === 'live')) {
      return {
        decision: 'checks_passed',
        riskScore: Math.max(5, Math.min(25, riskScore)),
        summary: "All automated biometric and active liveness criteria successfully satisfied.",
        flags
      };
    }

    // If face matching was marginal or active challenge didn't pass clearly, route to Human Officer Review
    if (!faceMatchPassed || !challengePassed || flags.length > 0) {
      return {
        decision: 'manual_review',
        riskScore: Math.min(75, riskScore),
        summary: "Verification resulted in ambiguous biometric correlation. Forwarded to Officer Review Portal for human verification.",
        flags
      };
    }

    return {
      decision: 'inconclusive',
      riskScore: 50,
      summary: "Inconclusive verification signals. Please retry verification.",
      flags
    };
  }
}
