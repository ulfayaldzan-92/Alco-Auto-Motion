import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Sparkles, X, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import {
  hasCustomApiKey,
  subscribeApiKeyChanges,
  getMaskedApiKey,
} from '../services/apiKeyService';

interface ApiKeyOnboardingCardProps {
  onOpenModal: () => void;
}

const DISMISS_KEY = 'alco_hide_apikey_onboarding';

export const ApiKeyOnboardingCard: React.FC<ApiKeyOnboardingCardProps> = ({ onOpenModal }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');

  useEffect(() => {
    const checkState = () => {
      const customKeyPresent = hasCustomApiKey();
      setHasKey(customKeyPresent);
      setMaskedKey(customKeyPresent ? getMaskedApiKey() : '');
      const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
      setIsDismissed(dismissed);
    };

    checkState();
    const unsubscribe = subscribeApiKeyChanges(() => {
      checkState();
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  // If user has key or explicitly dismissed, don't show the big onboarding card
  if (hasKey || isDismissed) {
    // If user has a key, show a subtle active confirmation badge
    if (hasKey) {
      return (
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                Gemini API Key Pribadi Aktif: <span className="font-mono text-emerald-400 font-semibold">{maskedKey}</span>
              </p>
              <p className="text-[11px] text-slate-300">
                Semua pemrosesan transkripsi audio video & scene director berjalan langsung dengan kuota API pribadi Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Kelola Key
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      id="gemini-apikey-onboarding-card"
      className="relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 rounded-2xl p-5 shadow-xl text-xs space-y-4"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        title="Tutup pemberitahuan"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              BYO GEMINI API KEY
            </span>
            <h3 className="text-sm font-bold text-white">
              Gunakan Gemini API Key Google AI Studio Anda Sendiri
            </h3>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Hubungkan API Key Google AI Studio Anda untuk transkripsi suara video asli tanpa batas antrian, kuota penuh, dan kecepatan analisis maksimal. Key tersimpan secara lokal dan aman di browser Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Dapatkan Key</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Masukkan API Key</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-indigo-900/40 flex flex-wrap items-center gap-4 text-[10px] text-indigo-200/80">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          100% Client-Side Local Storage
        </span>
        <span>•</span>
        <span>Mendukung model Gemini 3.7 Flash & Multimodal Speech Audio</span>
        <span>•</span>
        <span>Fallback ke default server jika kosong</span>
      </div>
    </div>
  );
};
