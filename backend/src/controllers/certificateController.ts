import { Request, Response } from 'express';
import { dbStore } from '../models/store';
import { CertificateService } from '../services/certificateService';

export class CertificateController {
  static async getByApplicationId(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { applicationId } = req.params;
    const cert = dbStore.findCertificateByAppId(applicationId);
    if (!cert) return res.status(404).json({ error: 'CERTIFICATE_NOT_FOUND' });

    if (cert.userId !== req.user.userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    return res.status(200).json({
      certificate: {
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        pensionerName: cert.pensionerName,
        ppoNumber: cert.ppoNumber,
        disbursingAgency: cert.disbursingAgency,
        issuedAt: cert.issuedAt,
        validUntil: cert.validUntil,
        status: cert.status,
        isDemonstrationOnly: cert.isDemonstrationOnly
      }
    });
  }

  static async downloadPdf(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { applicationId } = req.params;
    const cert = dbStore.findCertificateByAppId(applicationId);
    if (!cert) return res.status(404).json({ error: 'CERTIFICATE_NOT_FOUND' });

    if (cert.userId !== req.user.userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    try {
      const pdfBuffer = cert.pdfBase64 
        ? Buffer.from(cert.pdfBase64, 'base64')
        : await CertificateService.generateCertificatePdf(cert);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Digital_Life_Certificate_${cert.ppoNumber}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      return res.status(500).json({ error: 'PDF_RENDER_FAILED', message: err.message });
    }
  }
}
