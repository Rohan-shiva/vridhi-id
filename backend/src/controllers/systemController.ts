import { Request, Response } from 'express';
import { getDatabaseState } from '../config/database';
import { ModelClient } from '../services/modelClient';

export class SystemController {
  static async getHealth(req: Request, res: Response) {
    const dbState = getDatabaseState();
    const modelHealth = await ModelClient.checkHealth();

    return res.status(200).json({
      service: 'vridhi-id-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbState,
      modelService: modelHealth
    });
  }
}
