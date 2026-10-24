import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbStore } from '../models/store';
import { ModelClient } from '../services/modelClient';
import { RiskEngine } from '../services/riskEngine';
import { CertificateService } from '../services/certificateService';
import { IVerificationSession } from '../models/types';

export class VerificationController {
  static async startSession(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { applicationId } = req.body;
    const app = dbStore.findApplicationById(applicationId);
    if (!app || app.userId !== req.user.userId) {
      return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });
    }

    try {
      // Request active biometric challenge from Model Service
      const challengeData = await ModelClient.generateActiveChallenge();

      const session: IVerificationSession = {
        id: `vsess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        applicationId: app.id,
        userId: req.user.userId,
        challengeType: challengeData.challenge_type,
        challengeToken: challengeData.challenge_id,
        isTokenConsumed: false,
        modelResults: {},
        combinedRiskDecision: 'inconclusive',
        riskScore: 0,
        riskSummary: "Session initialized. Awaiting biometric presentation capture.",
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      };

      dbStore.saveVerificationSession(session);
      app.verificationSessionId = session.id;
      app.status = 'pending_verification';
      dbStore.saveApplication(app);

      return res.status(200).json({
        sessionId: session.id,
        challenge: {
          id: challengeData.challenge_id,
          type: challengeData.challenge_type,
          instructions: challengeData.instructions
        }
      });
    } catch (err: any) {
      return res.status(503).json({
        error: 'MODEL_SERVICE_ERROR',
        message: `Could not initialize biometric verification session: ${err.message}`
      });
    }
  }

  static async submitBiometrics(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { sessionId } = req.params;
    const session = dbStore.findVerificationSession(sessionId);
    if (!session || session.userId !== req.user.userId) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    }

    const app = dbStore.findApplicationById(session.applicationId);
    if (!app) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const liveImageFile = files?.['live_image']?.[0];
    const refImageFile = files?.['reference_image']?.[0] || liveImageFile; // Use enrolled or live baseline
    const challengeImageFile = files?.['challenge_image']?.[0];
    const liveAudioFile = files?.['live_audio']?.[0];
    const refAudioFile = files?.['reference_audio']?.[0] || liveAudioFile;

    if (!liveImageFile) {
      return res.status(400).json({ error: 'MISSING_MEDIA', message: "Live camera capture frame is required" });
    }

    try {
      // 1. Run Face PAD Inference
      const padResult = await ModelClient.runFacePad(liveImageFile.buffer);

      // 2. Run Face Matching Inference (if reference photo available)
      let matchResult = undefined;
      if (refImageFile) {
        matchResult = await ModelClient.runFaceMatch(liveImageFile.buffer, refImageFile.buffer);
      }

      // 3. Run Active Challenge Verification
      let challengeResult = undefined;
      if (challengeImageFile && session.challengeToken) {
        challengeResult = await ModelClient.verifyActiveChallenge(
          session.challengeToken,
          liveImageFile.buffer,
          challengeImageFile.buffer
        );
      }

      // 4. Run Speaker Verification & Audio Spoof Detection (if voice captured)
      let speakerResult = undefined;
      let audioSpoofResult = undefined;
      if (liveAudioFile) {
        audioSpoofResult = await ModelClient.runAudioSpoofCheck(liveAudioFile.buffer);
        if (refAudioFile) {
          speakerResult = await ModelClient.runSpeakerVerify(liveAudioFile.buffer, refAudioFile.buffer);
        }
      }

      // 5. Evaluate Multi-Signal Risk Engine
      const riskAssessment = RiskEngine.evaluate({
        facePad: padResult ? {
          prediction: padResult.prediction,
          liveProbability: padResult.live_probability,
          spoofProbability: padResult.spoof_probability,
          quality: {
            isSharp: padResult.quality?.is_sharp ?? true,
            isAdequatelyLit: padResult.quality?.is_adequately_lit ?? true,
            faceDetected: padResult.quality?.face_detected ?? true
          }
        } : undefined,
        faceMatch: matchResult ? {
          matched: matchResult.matched,
          similarityScore: matchResult.similarity_score,
          threshold: matchResult.threshold
        } : undefined,
        speakerVerify: speakerResult ? {
          verified: speakerResult.verified,
          similarityScore: speakerResult.similarity_score,
          threshold: speakerResult.threshold
        } : undefined,
        audioSpoof: audioSpoofResult ? {
          prediction: audioSpoofResult.prediction,
          bonafideProbability: audioSpoofResult.bonafide_probability,
          spoofProbability: audioSpoofResult.spoof_probability,
          anomalyFlags: audioSpoofResult.anomaly_flags || []
        } : undefined,
        activeChallenge: challengeResult ? {
          status: challengeResult.status,
          confidence: challengeResult.confidence
        } : undefined
      });

      // Update session record
      session.modelResults = {
        facePad: padResult,
        faceMatch: matchResult,
        speakerVerify: speakerResult,
        audioSpoof: audioSpoofResult,
        activeChallenge: challengeResult
      };
      session.combinedRiskDecision = riskAssessment.decision;
      session.riskScore = riskAssessment.riskScore;
      session.riskSummary = riskAssessment.summary;
      dbStore.saveVerificationSession(session);

      // Handle Application Workflow Transition
      let certificate = null;
      if (riskAssessment.decision === 'checks_passed') {
        certificate = await CertificateService.issueCertificateForApplication(app.id);
      } else if (riskAssessment.decision === 'manual_review') {
        app.status = 'under_review';
        dbStore.saveApplication(app);
      } else if (riskAssessment.decision === 'suspected_spoof') {
        app.status = 'rejected';
        dbStore.saveApplication(app);
      }

      dbStore.logAction({
        action: 'BIOMETRIC_VERIFICATION_EVALUATED',
        actorId: req.user.userId,
        details: {
          applicationId: app.id,
          decision: riskAssessment.decision,
          riskScore: riskAssessment.riskScore
        }
      });

      return res.status(200).json({
        sessionId: session.id,
        decision: riskAssessment.decision,
        riskScore: riskAssessment.riskScore,
        summary: riskAssessment.summary,
        flags: riskAssessment.flags,
        applicationStatus: app.status,
        certificate: certificate ? {
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt,
          validUntil: certificate.validUntil
        } : null
      });

    } catch (err: any) {
      console.error("[VerificationController] Error executing verification flow:", err);
      return res.status(502).json({
        error: 'INFERENCE_ERROR',
        message: `Biometric verification service failed: ${err.message}`
      });
    }
  }

  static async getStatus(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { sessionId } = req.params;
    const session = dbStore.findVerificationSession(sessionId);
    if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' });

    return res.status(200).json({ session });
  }
}
