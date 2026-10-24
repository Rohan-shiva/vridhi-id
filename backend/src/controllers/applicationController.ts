import { Request, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../models/store';
import { IPensionApplication } from '../models/types';

const createApplicationSchema = z.object({
  pensionerName: z.string().min(2, "Pensioner name required"),
  ppoNumber: z.string().min(6, "Valid PPO Number required"),
  dateOfBirth: z.string().min(8, "Date of birth required"),
  pensionAuthority: z.string().min(2, "Pension Sanctioning Authority required"),
  disbursingAgency: z.string().min(2, "Disbursing Bank or Post Office required"),
  accountNumber: z.string().min(4, "Bank account number required"),
  consentGiven: z.boolean().refine(val => val === true, "Aadhaar / Biometric consent is required to proceed")
});

export class ApplicationController {
  static async create(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    try {
      const parsed = createApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: parsed.error.errors.map(e => e.message).join(', ')
        });
      }

      const appData = parsed.data;
      const newApp: IPensionApplication = {
        id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: req.user.userId,
        ...appData,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dbStore.saveApplication(newApp);
      dbStore.logAction({
        action: 'PENSION_APPLICATION_CREATED',
        actorId: req.user.userId,
        details: { applicationId: newApp.id, ppoNumber: newApp.ppoNumber }
      });

      return res.status(201).json({
        message: "Pension application registered successfully",
        application: newApp
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'CREATION_FAILED', message: err.message });
    }
  }

  static async getUserApplications(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const apps = dbStore.findApplicationsByUserId(req.user.userId);
    // Enrich with certificate if available
    const enriched = apps.map(app => {
      const cert = dbStore.findCertificateByAppId(app.id);
      return {
        ...app,
        certificate: cert ? {
          certificateNumber: cert.certificateNumber,
          issuedAt: cert.issuedAt,
          validUntil: cert.validUntil,
          status: cert.status
        } : null
      };
    });

    return res.status(200).json({ applications: enriched });
  }

  static async getById(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { id } = req.params;
    const app = dbStore.findApplicationById(id);
    if (!app) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });

    // Allow owner or officer
    if (app.userId !== req.user.userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const cert = dbStore.findCertificateByAppId(app.id);
    return res.status(200).json({
      application: app,
      certificate: cert || null
    });
  }
}
