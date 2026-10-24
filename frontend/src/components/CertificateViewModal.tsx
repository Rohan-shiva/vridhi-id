import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { X, Download, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface CertificateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  isOpen,
  onClose,
  applicationId
}) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      const blob = await ApiService.downloadCertificateBlob(applicationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Digital_Life_Certificate_${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-4 border-gov-navy my-8 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black">{t('certificate.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Watermark Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold leading-relaxed">
            {t('certificate.demoWatermark')}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-gov-navy">
              डिजिटल सत्यापन सत्यापित (Verified)
            </h3>
            <p className="text-xs text-slate-600">
              चेहरे की जीवितता एवं आवाज डीपफेक जांच एआई मॉडल द्वारा सफलतापूर्वक पास की गई।
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{downloading ? "डाउनलोड हो रहा है..." : t('certificate.downloadPdf')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
