const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('vridhi_token');
  }

  private static headers(isMultipart: boolean = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Auth ---
  static async requestOtp(mobile: string) {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ mobile })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to request OTP');
    return data;
  }

  static async verifyOtp(mobile: string, otp: string, language: string = 'hi') {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ mobile, otp, language })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to verify OTP');
    if (data.token) {
      localStorage.setItem('vridhi_token', data.token);
    }
    return data;
  }

  static async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Unauthorized");
    return await res.json();
  }

  static async updateLanguage(language: string) {
    const res = await fetch(`${API_BASE}/auth/language`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ language })
    });
    return await res.json();
  }

  // --- Applications ---
  static async createApplication(appData: any) {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(appData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to register application');
    return data;
  }

  static async getUserApplications() {
    const res = await fetch(`${API_BASE}/applications`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Failed to load applications");
    return await res.json();
  }

  static async getApplicationById(id: string) {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Application not found");
    return await res.json();
  }

  // --- Verification ---
  static async startVerificationSession(applicationId: string) {
    const res = await fetch(`${API_BASE}/verification/session`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ applicationId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to start verification");
    return data;
  }

  static async submitBiometrics(sessionId: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/verification/session/${sessionId}/biometrics`, {
      method: 'POST',
      headers: this.headers(true),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Biometric submission error");
    return data;
  }

  // --- Certificate ---
  static async getCertificate(applicationId: string) {
    const res = await fetch(`${API_BASE}/certificates/application/${applicationId}`, {
      headers: this.headers()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Certificate record not available");
    return data;
  }

  static getCertificateDownloadUrl(applicationId: string): string {
    return `${API_BASE}/certificates/application/${applicationId}/download`;
  }

  static async downloadCertificateBlob(applicationId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/certificates/application/${applicationId}/download`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Failed to download certificate PDF");
    return await res.blob();
  }

  // --- Officer ---
  static async getOfficerQueue() {
    const res = await fetch(`${API_BASE}/officer/queue`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Failed to fetch officer queue");
    return await res.json();
  }

  static async getOfficerCaseDetails(id: string) {
    const res = await fetch(`${API_BASE}/officer/case/${id}`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error("Failed to fetch case details");
    return await res.json();
  }

  static async recordOfficerReview(id: string, decision: string, reason: string) {
    const res = await fetch(`${API_BASE}/officer/case/${id}/review`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ decision, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to record officer review");
    return data;
  }
}
