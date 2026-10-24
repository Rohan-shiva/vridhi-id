import {
  IUser,
  IOTPChallenge,
  IPensionApplication,
  IVerificationSession,
  ICertificateRecord,
  IOfficerReview,
  IAuditLog
} from './types';
import { config } from '../config';

// In-Memory storage containers
class DataStore {
  users: Map<string, IUser> = new Map();
  otpChallenges: Map<string, IOTPChallenge> = new Map();
  applications: Map<string, IPensionApplication> = new Map();
  verificationSessions: Map<string, IVerificationSession> = new Map();
  certificates: Map<string, ICertificateRecord> = new Map();
  reviews: Map<string, IOfficerReview> = new Map();
  auditLogs: IAuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // Seed initial officer account
    const officerId = 'officer-default-001';
    this.users.set(officerId, {
      id: officerId,
      mobile: config.INITIAL_OFFICER_MOBILE,
      name: config.INITIAL_OFFICER_NAME,
      role: 'officer',
      languagePreference: 'hi',
      createdAt: new Date().toISOString()
    });
  }

  // --- Users ---
  findUserByMobile(mobile: string): IUser | undefined {
    return Array.from(this.users.values()).find(u => u.mobile === mobile);
  }
  findUserById(id: string): IUser | undefined {
    return this.users.get(id);
  }
  saveUser(user: IUser): IUser {
    this.users.set(user.id, user);
    return user;
  }

  // --- OTP Challenges ---
  findActiveOtp(mobile: string): IOTPChallenge | undefined {
    const now = Date.now();
    return Array.from(this.otpChallenges.values())
      .filter(o => o.mobile === mobile && !o.isUsed && o.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }
  saveOtp(challenge: IOTPChallenge): IOTPChallenge {
    this.otpChallenges.set(challenge.id, challenge);
    return challenge;
  }

  // --- Applications ---
  findApplicationsByUserId(userId: string): IPensionApplication[] {
    return Array.from(this.applications.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  findApplicationById(id: string): IPensionApplication | undefined {
    return this.applications.get(id);
  }
  findAllApplications(): IPensionApplication[] {
    return Array.from(this.applications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  saveApplication(app: IPensionApplication): IPensionApplication {
    this.applications.set(app.id, app);
    return app;
  }

  // --- Verification Sessions ---
  findVerificationSession(id: string): IVerificationSession | undefined {
    return this.verificationSessions.get(id);
  }
  saveVerificationSession(session: IVerificationSession): IVerificationSession {
    this.verificationSessions.set(session.id, session);
    return session;
  }

  // --- Certificates ---
  findCertificateByAppId(applicationId: string): ICertificateRecord | undefined {
    return Array.from(this.certificates.values()).find(c => c.applicationId === applicationId);
  }
  findCertificateByUserId(userId: string): ICertificateRecord | undefined {
    return Array.from(this.certificates.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
  }
  saveCertificate(cert: ICertificateRecord): ICertificateRecord {
    this.certificates.set(cert.id, cert);
    return cert;
  }

  // --- Reviews ---
  findReviewsByAppId(applicationId: string): IOfficerReview[] {
    return Array.from(this.reviews.values())
      .filter(r => r.applicationId === applicationId)
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  }
  saveReview(review: IOfficerReview): IOfficerReview {
    this.reviews.set(review.id, review);
    return review;
  }

  // --- Audit Logs ---
  logAction(log: Omit<IAuditLog, 'id' | 'timestamp'>): IAuditLog {
    const fullLog: IAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.auditLogs.push(fullLog);
    return fullLog;
  }
  getAuditLogs(limit: number = 50): IAuditLog[] {
    return this.auditLogs.slice(-limit).reverse();
  }
}

export const dbStore = new DataStore();
