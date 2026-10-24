import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dbStore } from '../models/store';
import { config } from '../config';
import { IOTPChallenge } from '../models/types';

const OTP_EXPIRY_MS = 5 * 60 * 1000;      // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds
const MAX_ATTEMPTS = 3;

export class OtpService {
  static async requestOtp(mobile: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number; testOtp?: string }> {
    // Validate Indian mobile number format (10 digits)
    const cleanedMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      throw new Error("Invalid mobile number. Please provide a valid 10-digit Indian mobile number.");
    }

    const existing = dbStore.findActiveOtp(cleanedMobile);
    const now = Date.now();

    if (existing && now < existing.resendAvailableAt) {
      const waitSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSec} seconds before requesting a new OTP.`,
        cooldownSeconds: waitSec
      };
    }

    // Invalidate prior OTPs
    if (existing) {
      existing.isUsed = true;
      dbStore.saveOtp(existing);
    }

    // Cryptographically secure random 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);

    const challenge: IOTPChallenge = {
      id: `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      mobile: cleanedMobile,
      otpHash,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAt: now + OTP_EXPIRY_MS,
      resendAvailableAt: now + RESEND_COOLDOWN_MS,
      isUsed: false,
      createdAt: now
    };

    dbStore.saveOtp(challenge);
    dbStore.logAction({
      action: 'OTP_REQUESTED',
      details: { mobile: `******${cleanedMobile.slice(-4)}` }
    });

    console.log(`[OTP Gateway] OTP issued for ******${cleanedMobile.slice(-4)}.`);
    
    // In local dev test mode, surface test OTP to simplify automated validation
    const testOtp = (config.OTP_TEST_MODE && config.NODE_ENV !== 'production') ? rawOtp : undefined;

    return {
      success: true,
      message: "One-Time Password has been dispatched to your mobile number.",
      cooldownSeconds: 60,
      testOtp
    };
  }

  static async verifyOtp(mobile: string, otpInput: string): Promise<{ success: boolean; message: string }> {
    const cleanedMobile = mobile.replace(/\D/g, '').slice(-10);
    const challenge = dbStore.findActiveOtp(cleanedMobile);

    if (!challenge) {
      return {
        success: false,
        message: "No active OTP request found for this mobile number, or OTP has expired."
      };
    }

    if (Date.now() > challenge.expiresAt) {
      challenge.isUsed = true;
      dbStore.saveOtp(challenge);
      return {
        success: false,
        message: "This OTP has expired. Please request a fresh code."
      };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.isUsed = true;
      dbStore.saveOtp(challenge);
      return {
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new OTP."
      };
    }

    challenge.attempts += 1;
    const isMatch = await bcrypt.compare(otpInput.trim(), challenge.otpHash);

    if (!isMatch) {
      dbStore.saveOtp(challenge);
      const remaining = challenge.maxAttempts - challenge.attempts;
      return {
        success: false,
        message: `Incorrect OTP. You have ${remaining} attempt(s) remaining.`
      };
    }

    // Mark as consumed
    challenge.isUsed = true;
    dbStore.saveOtp(challenge);

    dbStore.logAction({
      action: 'OTP_VERIFIED_SUCCESS',
      details: { mobile: `******${cleanedMobile.slice(-4)}` }
    });

    return {
      success: true,
      message: "Mobile verification successful."
    };
  }
}
