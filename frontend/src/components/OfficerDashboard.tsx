import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { ShieldAlert, CheckCircle2, XCircle, RotateCcw, Clock, ArrowLeft, Eye, AlertCircle } from 'lucide-react';

interface OfficerDashboardProps {
  onBack: () => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_correction'>('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getOfficerQueue();
      setQueue(data.queue || []);
    } catch (err: any) {
      console.error("Failed to load officer queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = async (id: string) => {
    try {
      const data = await ApiService.getOfficerCaseDetails(id);
      setSelectedCase(data);
      setReason('');
      setMsg(null);
    } catch (err: any) {
      alert("Failed to fetch case details: " + err.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedCase || !reason.trim()) {
      alert("Please provide a substantive review reason or remark.");
      return;
    }

    setSubmitting(true);
    try {
      await ApiService.recordOfficerReview(selectedCase.application.id, decision, reason);
      setMsg(`Case successfully adjudicated with decision: ${decision}`);
      setTimeout(() => {
        setSelectedCase(null);
        loadQueue();
      }, 1200);
    } catch (err: any) {
      alert("Review recording failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>मुख्य डैशबोर्ड पर लौटें</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
          Authorized Verification Officer Session
        </span>
      </div>

      {/* Main Queue Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-black">{t('officer.title')}</h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10">
            {queue.length} प्रकरण (Cases)
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-base font-bold text-gov-navy mb-4">
            {t('officer.queueHeading')}
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500 py-6 text-center">कतार लोड हो रही है...</p>
          ) : queue.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">समीक्षा हेतु कोई लंबित आवेदन नहीं है।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-3">पेंशनभोगी (Name)</th>
                    <th className="pb-3 px-3">PPO संख्या</th>
                    <th className="pb-3 px-3">स्थिति (Status)</th>
                    <th className="pb-3 px-3">जोखिम (Risk)</th>
                    <th className="pb-3 px-3 text-right">कार्यवाही</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-gov-navy">{item.pensionerName}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{item.ppoNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'under_review' ? 'bg-amber-100 text-amber-800' :
                          item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.riskScore !== null ? (
                          <span className="font-bold text-xs text-slate-700">
                            {item.riskScore} / 100
                          </span>
                        ) : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenCase(item.id)}
                          className="px-3 py-1 text-xs font-bold rounded bg-gov-navy text-white hover:bg-gov-blue transition inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>समीक्षा करें</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-slate-300 my-8 overflow-hidden animate-fadeIn">
            <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black">{t('officer.reviewModalTitle')}</h3>
              <button onClick={() => setSelectedCase(null)} className="text-white hover:text-slate-300 font-bold">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {msg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                  {msg}
                </div>
              )}

              {/* Case details summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold">नाम:</span>{" "}
                  <span className="font-bold text-gov-navy">{selectedCase.application.pensionerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">PPO:</span>{" "}
                  <span className="font-mono font-bold text-slate-900">{selectedCase.application.ppoNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">एजेंसी:</span>{" "}
                  <span>{selectedCase.application.disbursingAgency}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">खाता संख्या:</span>{" "}
                  <span className="font-mono">{selectedCase.application.accountNumber}</span>
                </div>
              </div>

              {/* AI Biometric Inference Evidence */}
              {selectedCase.verificationSession?.modelResults && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                  <span className="font-bold uppercase tracking-wider text-amber-900 block">
                    एआई बायोमेट्रिक साक्ष्य (Model Inference Audit Trail)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-800">
                    <div>Face PAD Live Prob: <b>{selectedCase.verificationSession.modelResults.facePad?.live_probability ?? 'N/A'}</b></div>
                    <div>Face Match Score: <b>{selectedCase.verificationSession.modelResults.faceMatch?.similarity_score ?? 'N/A'}</b></div>
                    <div>Voice Match Score: <b>{selectedCase.verificationSession.modelResults.speakerVerify?.similarity_score ?? 'N/A'}</b></div>
                    <div>Audio Bonafide Prob: <b>{selectedCase.verificationSession.modelResults.audioSpoof?.bonafide_probability ?? 'N/A'}</b></div>
                  </div>
                </div>
              )}

              {/* Decision Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  अधिकारी निर्णय (Adjudication Decision) *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                      decision === 'approved' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>स्वीकृत (Approve)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                      decision === 'rejected' 
                        ? 'border-red-600 bg-red-50 text-red-800' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>अस्वीकृत (Reject)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('needs_correction')}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                      decision === 'needs_correction' 
                        ? 'border-amber-600 bg-amber-50 text-amber-800' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>संशोधन (Correction)</span>
                  </button>
                </div>
              </div>

              {/* Reason / Remarks Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('officer.reasonLabel')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="उदा. बायोमेट्रिक जीवितता संकेतों और पेंशन अभिलेखों के सत्यापन उपरांत प्रमाण पत्र संस्वीकृत किया जाता है।"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitReview}
                  className="px-6 py-2.5 rounded-xl bg-gov-navy text-white text-sm font-bold hover:bg-gov-blue transition shadow-md disabled:opacity-50"
                >
                  {submitting ? "प्रसंस्करण जारी..." : t('officer.submitDecision')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
