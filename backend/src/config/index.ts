import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/vridhi_id'),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters").default('vridhi_id_secure_jwt_secret_key_minimum_length_2026'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  MODEL_SERVICE_URL: z.string().default('http://localhost:8000'),
  OTP_TEST_MODE: z.string().transform(val => val === 'true').default('true'),
  INITIAL_OFFICER_MOBILE: z.string().default('9876543210'),
  INITIAL_OFFICER_NAME: z.string().default('Senior Verification Officer')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Configuration validation error in environment variables:", parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Invalid backend environment configuration. Shutting down.");
  }
}

export const config = parsed.success ? parsed.data : envSchema.parse({});
