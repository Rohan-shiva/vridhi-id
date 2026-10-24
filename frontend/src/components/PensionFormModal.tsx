import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface PensionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (app: any) => void;
}

export const PensionFormModal: React.FC<PensionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    pensionerName: '',
    ppoNumber: '',
    dateOfBirth: '1952-05-10',
    pensionAuthority: 'Central Pension Accounting Office (CPAO)',
    disbursingAgency: 'State Bank of India',
    accountNumber: '',
    consentGiven: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.consentGiven) {
      setError(t('form.consent'));
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.createApplication(formData);
      onSuccess(data.application);
    } catch (err: any) {
      setError(err.message || "Failed to submit pension application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-slate-300 my-8 overflow-hidden animate-fadeIn">
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black">
            {t('form.title')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('form.name')} *
            </label>
            <input
              type="text"
              required
              value={formData.pensionerName}
              onChange={(e) => setFormData({ ...formData, pensionerName: e.target.value })}
              placeholder="उदा. रामेश्वर शर्मा"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('form.ppo')} *
              </label>
              <input
                type="text"
                required
                value={formData.ppoNumber}
                onChange={(e) => setFormData({ ...formData, ppoNumber: e.target.value })}
                placeholder="PPO-2026-KA-12345"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('form.dob')} *
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('form.authority')} *
            </label>
            <select
              value={formData.pensionAuthority}
              onChange={(e) => setFormData({ ...formData, pensionAuthority: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-semibold text-slate-900 bg-white"
            >
              <option value="Central Pension Accounting Office (CPAO)">Central Pension Accounting Office (CPAO)</option>
              <option value="Defence Pension (SPARSH / PCDA)">Defence Pension (SPARSH / PCDA)</option>
              <option value="Railways Pension Directorate">Railways Pension Directorate</option>
              <option value="State Government Pension System">State Government Pension System</option>
              <option value="Postal / Telecom Pension">Postal / Telecom Pension</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('form.agency')} *
              </label>
              <input
                type="text"
                required
                value={formData.disbursingAgency}
                onChange={(e) => setFormData({ ...formData, disbursingAgency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('form.account')} *
              </label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="उदा. 30894726511"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-gov-navy focus:outline-none font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={formData.consentGiven}
              onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded text-gov-navy focus:ring-gov-navy cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-slate-700 font-medium leading-relaxed cursor-pointer">
              {t('form.consent')}
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gov-navy text-white hover:bg-gov-blue transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "प्रसंस्करण जारी..." : t('form.proceedToVerification')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
