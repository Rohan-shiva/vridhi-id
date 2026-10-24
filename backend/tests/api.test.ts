import request from 'supertest';
import app from '../src/server';

describe('Vridhi-ID Backend API Integration Tests', () => {
  let authToken: string;
  let testMobile = '9876500001';
  let receivedOtp: string;

  it('GET /api/v1/system/health - should report service and model health', async () => {
    const res = await request(app).get('/api/v1/system/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('vridhi-id-backend');
    expect(res.body.database).toBeDefined();
  });

  it('POST /api/v1/auth/request-otp - should dispatch OTP in test mode', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ mobile: testMobile });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.testOtp).toBeDefined();
    receivedOtp = res.body.testOtp;
  });

  it('POST /api/v1/auth/verify-otp - should reject invalid OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ mobile: testMobile, otp: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('VERIFICATION_FAILED');
  });

  it('POST /api/v1/auth/verify-otp - should verify valid OTP and issue session JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ mobile: testMobile, otp: receivedOtp, language: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.mobile).toBe(testMobile);
    authToken = res.body.token;
  });

  it('GET /api/v1/auth/me - should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.mobile).toBe(testMobile);
    expect(res.body.user.role).toBe('pensioner');
  });

  it('PATCH /api/v1/auth/language - should update preferred language to kn (Kannada)', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/language')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ language: 'kn' });

    expect(res.status).toBe(200);
    expect(res.body.languagePreference).toBe('kn');
  });

  it('POST /api/v1/applications - should create new pension application record', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        pensionerName: 'Govinda Rao',
        ppoNumber: 'PPO-2026-KA-99128',
        dateOfBirth: '1948-06-15',
        pensionAuthority: 'Central Pension Accounting Office (CPAO)',
        disbursingAgency: 'State Bank of India',
        accountNumber: '10982736451',
        consentGiven: true
      });

    expect(res.status).toBe(201);
    expect(res.body.application.pensionerName).toBe('Govinda Rao');
    expect(res.body.application.status).toBe('draft');
  });

  it('GET /api/v1/officer/queue - should forbid non-officer pensioner access', async () => {
    const res = await request(app)
      .get('/api/v1/officer/queue')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });
});
