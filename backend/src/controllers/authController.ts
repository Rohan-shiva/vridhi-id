import { Request, Response } from 'express';
import { z } from 'zod';
import { OtpService } from '../services/otpService';
import { AuthService } from '../services/authService';
import { dbStore } from '../models/store';

const requestOtpSchema = z.object({
  mobile: z.string().min(10).max(14)
});

const verifyOtpSchema = z.object({
  mobile: z.string().min(10).max(14),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  language: z.string().optional().default('hi')
});

export class AuthController {
  static async requestOtp(req: Request, res: Response) {
    try {
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Please provide a valid 10-digit mobile number'
        });
      }

      const result = await OtpService.requestOtp(parsed.data.mobile);
      if (!result.success) {
        return res.status(429).json({
          error: 'COOLDOWN_ACTIVE',
          message: result.message,
          cooldownSeconds: result.cooldownSeconds
        });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({
        error: 'REQUEST_FAILED',
        message: err.message
      });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Please provide both mobile number and 6-digit OTP'
        });
      }

      const { mobile, otp, language } = parsed.data;
      const result = await OtpService.verifyOtp(mobile, otp);

      if (!result.success) {
        return res.status(401).json({
          error: 'VERIFICATION_FAILED',
          message: result.message
        });
      }

      const user = AuthService.getOrCreateUserByMobile(mobile, language);
      const token = AuthService.generateToken(user);

      return res.status(200).json({
        message: "Authentication successful",
        token,
        user: {
          id: user.id,
          mobile: user.mobile,
          role: user.role,
          name: user.name,
          languagePreference: user.languagePreference
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: err.message
      });
    }
  }

  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const user = dbStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        languagePreference: user.languagePreference
      }
    });
  }

  static async updateLanguage(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const { language } = req.body;
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'INVALID_LANGUAGE' });
    }

    const user = dbStore.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    user.languagePreference = language;
    dbStore.saveUser(user);

    return res.status(200).json({
      message: "Language preference updated",
      languagePreference: user.languagePreference
    });
  }
}
