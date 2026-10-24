export type UserRole = 'pensioner' | 'officer' | 'admin';

export interface IUser {
  id: string;
  mobile: string;
  name?: string;
  role: UserRole;
  languagePreference: string;
  createdAt: string;
}

export interface IOTPChallenge {
  id: string;
  mobile: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  resendAvailableAt: number;
  isUsed: boolean;
  createdAt: number;
}

export type ApplicationStatus = 'draft' | 'pending_verification' | 'under_review' | 'approved' | 'rejected';

export interface IPensionApplication {
  id: string;
  userId: string;
  ppoNumber: string;
  pensionerName: string;
  dateOfBirth: string;
  pensionAuthority: string;
  disbursingAgency: string;
  accountNumber: string;
  consentGiven: boolean;
  status: ApplicationStatus;
  verificationSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RiskOutcome = 'checks_passed' | 'retry_required' | 'inconclusive' | 'manual_review' | 'suspected_spoof' | 'service_unavailable';

export interface IVerificationSession {
  id: string;
  applicationId: string;
  userId: string;
  challengeType: string;
  challengeToken: string;
  isTokenConsumed: boolean;
  modelResults: {
    facePad?: {
      prediction: string;
      liveProbability: number;
      spoofProbability: number;
      quality: {
        isSharp: boolean;
        isAdequatelyLit: boolean;
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
      durationSeconds: number;
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
  };
  combinedRiskDecision: RiskOutcome;
  riskScore: number;
  riskSummary: string;
  createdAt: string;
  expiresAt: number;
}

export interface ICertificateRecord {
  id: string;
  certificateNumber: string;
  applicationId: string;
  userId: string;
  pensionerName: string;
  ppoNumber: string;
  disbursingAgency: string;
  issuedAt: string;
  validUntil: string;
  status: 'valid' | 'revoked' | 'expired';
  isDemonstrationOnly: boolean;
  pdfBase64?: string;
}

export interface IOfficerReview {
  id: string;
  applicationId: string;
  officerId: string;
  officerName: string;
  decision: 'approved' | 'rejected' | 'needs_correction';
  reason: string;
  reviewedAt: string;
}

export interface IAuditLog {
  id: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
