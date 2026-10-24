import { config } from '../config';

export class ModelClient {
  private static baseUrl = config.MODEL_SERVICE_URL;

  static async checkHealth(): Promise<{ status: string; models: Record<string, boolean> }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Model service responded with HTTP ${res.status}`);
      const data = await res.json();
      return { status: data.status, models: data.models_loaded };
    } catch (err: any) {
      console.warn(`[ModelClient] Health check failed: ${err.message}`);
      return {
        status: 'unavailable',
        models: {
          face_pad_minifasnet: false,
          face_matcher_mobilefacenet: false,
          speaker_ecapa: false,
          audio_spectral_antispoof: false
        }
      };
    }
  }

  static async runFacePad(imageBuffer: Buffer, filename: string = 'face.jpg'): Promise<any> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    formData.append('image', blob, filename);

    const res = await fetch(`${this.baseUrl}/api/v1/face/pad`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Face PAD inference failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  static async runFaceMatch(liveBuffer: Buffer, refBuffer: Buffer, threshold: number = 0.60): Promise<any> {
    const formData = new FormData();
    formData.append('live_image', new Blob([new Uint8Array(liveBuffer)], { type: 'image/jpeg' }), 'live.jpg');
    formData.append('reference_image', new Blob([new Uint8Array(refBuffer)], { type: 'image/jpeg' }), 'ref.jpg');
    formData.append('threshold', threshold.toString());

    const res = await fetch(`${this.baseUrl}/api/v1/face/match`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Face match inference failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  static async runSpeakerVerify(liveAudioBuffer: Buffer, refAudioBuffer: Buffer, threshold: number = 0.68): Promise<any> {
    const formData = new FormData();
    formData.append('live_audio', new Blob([new Uint8Array(liveAudioBuffer)], { type: 'audio/wav' }), 'live.wav');
    formData.append('reference_audio', new Blob([new Uint8Array(refAudioBuffer)], { type: 'audio/wav' }), 'ref.wav');
    formData.append('threshold', threshold.toString());

    const res = await fetch(`${this.baseUrl}/api/v1/speaker/verify`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Speaker verification failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  static async runAudioSpoofCheck(audioBuffer: Buffer): Promise<any> {
    const formData = new FormData();
    formData.append('audio', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' }), 'sample.wav');

    const res = await fetch(`${this.baseUrl}/api/v1/audio/spoof-check`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Audio spoof check failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  static async generateActiveChallenge(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/v1/challenge/generate`, {
      method: 'POST',
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error("Could not obtain active challenge from model service");
    return await res.json();
  }

  static async verifyActiveChallenge(challengeId: string, initialBuf: Buffer, challengeBuf: Buffer): Promise<any> {
    const formData = new FormData();
    formData.append('challenge_id', challengeId);
    formData.append('initial_image', new Blob([new Uint8Array(initialBuf)], { type: 'image/jpeg' }), 'initial.jpg');
    formData.append('challenge_image', new Blob([new Uint8Array(challengeBuf)], { type: 'image/jpeg' }), 'challenge.jpg');

    const res = await fetch(`${this.baseUrl}/api/v1/challenge/verify`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Active challenge verification failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }
}
