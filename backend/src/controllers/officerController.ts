import { Request, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../models/store';
import { CertificateService } from '../services/certificateService';
import { IOfficerReview } from '../models/types';

const reviewDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'needs_correction']),
  reason: z.string().min(5, "A substantive review reason or remark is required")
});

export class OfficerController {
  static async getQueue(req: Request, res: Response) {
    const apps = dbStore.findAllApplications();
    const queue = apps.map(app => {
      const session = app.verificationSessionId 
        ? dbStore.findVerificationSession(app.verificationSessionId)
        : null;

      return {
        id: app.id,
        pensionerName: app.pensionerName,
        ppoNumber: app.ppoNumber,
        disbursingAgency: app.disbursingAgency,
        status: app.status,
        createdAt: app.createdAt,
        riskScore: session?.riskScore ?? null,
        riskDecision: session?.combinedRiskDecision ?? null,
        riskSummary: session?.riskSummary ?? null
      };
    });

    return res.status(200).json({ queue });
  }

  static async getCaseDetails(req: Request, res: Response) {
    const { id } = req.params;
    const app = dbStore.findApplicationById(id);
    if (!app) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

    const session = app.verificationSessionId 
      ? dbStore.findVerificationSession(app.verificationSessionId)
      : null;
    const reviews = dbStore.findReviewsByAppId(app.id);
    const cert = dbStore.findCertificateByAppId(app.id);

    return res.status(200).json({
      application: app,
      verificationSession: session,
      reviews,
      certificate: cert ? {
        certificateNumber: cert.certificateNumber,
        issuedAt: cert.issuedAt,
        status: cert.status
      } : null
    });
  }

  static async recordReview(req: Request, res: Response) {
    const { id } = req.params;
    const app = dbStore.findApplicationById(id);
    if (!app) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

    const parsed = reviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors.map(e => e.message).join(', ')
      });
    }

    const { decision, reason } = parsed.data;

    const review: IOfficerReview = {
      id: `rev-${Date.now()}`,
      applicationId: app.id,
      officerId: req.user!.userId,
      officerName: req.user?.mobile ? `Officer (ID: ${req.user.userId.slice(-4)})` : 'Verification Officer',
      decision,
      reason,
      reviewedAt: new Date().toISOString()
    };

    dbStore.saveReview(review);

    if (decision === 'approved') {
      app.status = 'approved';
      dbStore.saveApplication(app);
      await CertificateService.issueCertificateForApplication(app.id);
    } else if (decision === 'rejected') {
      app.status = 'rejected';
      dbStore.saveApplication(app);
    } else if (decision === 'needs_correction') {
      app.status = 'draft';
      dbStore.saveApplication(app);
    }

    dbStore.logAction({
      action: 'OFFICER_REVIEW_RECORDED',
      actorId: req.user!.userId,
      actorRole: 'officer',
      details: {
        applicationId: app.id,
        decision,
        reason
      }
    });

    return res.status(200).json({
      message: `Case review successfully recorded with decision: ${decision}`,
      review,
      applicationStatus: app.status
    });
  }

  static async getAuditLogs(req: Request, res: Response) {
    const logs = dbStore.getAuditLogs(100);
    return res.status(200).json({ logs });
  }
}
