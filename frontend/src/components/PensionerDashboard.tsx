import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiService } from '../services/api';
import { VoiceService } from '../voice/voiceEngine';
import { FilePlus2, Download, Clock, CheckCircle2, AlertTriangle, ArrowRight, FileText } from 'lucide-react';

interface PensionerDashboardProps {
  user: any;
  onStartApplication: () => void;
  onOpenDownload: (appId?: string) => void;
  currentLang: string;
}

export const PensionerDashboard: React.FC<PensionerDashboardProps> = ({
  user,
  onStartApplication,
  onOpenDownload,
  currentLang
}) => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
    // Announce dashboard options
    VoiceService.speak("आप क्या करना चाहते हैं? नया जीवन प्रमाण पत्र बनाएं, या मौजूदा प्रमाण पत्र डाउनलोड करें?", currentLang);
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getUserApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> स्वीकृत (Approved)
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1" /> अधिकारी समीक्षाधीन (Under Review)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> अस्वीकृत (Rejected)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            प्रक्रिया जारी (In Progress)
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gov-navy to-gov-blue text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
            {t('dashboard.pensionerSub')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {t('dashboard.welcomeUser')}, {user?.name || user?.mobile}
          </h1>
          <p className="text-sm text-slate-200 mt-1 max-w-xl">
            {t('officialNotice')}
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
          आधार / बायोमेट्रिक सहायता प्रणाली
        </div>
      </div>

      {/* Primary Choices (Option A & Option B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A: Generate DLC */}
        <div 
          onClick={onStartApplication}
          className="p-6 sm:p-8 bg-white rounded-2xl shadow-md border-2 border-slate-200 hover:border-gov-navy transition group cursor-pointer flex flex-col justify-between"
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-gov-saffron border-2 border-amber-200 flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <FilePlus2 className="w-7 h-7" />
            </div>
            <span className="text-xs font-black uppercase text-gov-saffron tracking-wider">
              विकल्प A / Option A
            </span>
            <h2 className="text-2xl font-black text-gov-navy mt-1 group-hover:text-gov-blue transition">
              {t('dashboard.optionATitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {t('dashboard.optionADesc')}
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between font-bold text-gov-navy">
            <span>{t('dashboard.optionABtn')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Option B: Download DLC */}
        <div 
          onClick={() => onOpenDownload(applications[0]?.id)}
          className="p-6 sm:p-8 bg-white rounded-2xl shadow-md border-2 border-slate-200 hover:border-gov-navy transition group cursor-pointer flex flex-col justify-between"
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-200 flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <Download className="w-7 h-7" />
            </div>
            <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
              विकल्प B / Option B
            </span>
            <h2 className="text-2xl font-black text-gov-navy mt-1 group-hover:text-gov-blue transition">
              {t('dashboard.optionBTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {t('dashboard.optionBDesc')}
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between font-bold text-gov-navy">
            <span>{t('dashboard.optionBBtn')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Recent Certificate Applications Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
        <h3 className="text-lg font-black text-gov-navy mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-gov-blue" />
          {t('dashboard.statusHeader')}
        </h3>

        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">आवेदन लोड हो रहे हैं...</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">{t('dashboard.noApps')}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div key={app.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-gov-navy">{app.pensionerName}</span>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PPO: <span className="font-mono font-bold text-slate-700">{app.ppoNumber}</span> • {app.disbursingAgency}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {app.status === 'approved' && (
                    <button
                      onClick={() => onOpenDownload(app.id)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  )}
                  {app.status === 'draft' && (
                    <button
                      onClick={onStartApplication}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gov-navy text-white hover:bg-gov-blue transition"
                    >
                      जारी रखें
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
