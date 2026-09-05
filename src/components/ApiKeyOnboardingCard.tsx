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
        <div className="alco-card flex items-center justify-between gap-3 border-emerald-200 bg-emerald-50 p-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-bold text-foreground">
                Gemini API Key Pribadi Aktif: <span className="font-mono font-semibold text-emerald-700">{maskedKey}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                Semua pemrosesan transkripsi audio video & scene director berjalan langsung dengan kuota API pribadi Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="shrink-0 cursor-pointer rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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
      className="alco-card relative space-y-4 overflow-hidden p-5 text-xs"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Tutup pemberitahuan"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Zap className="w-3 h-3 text-primary" />
              BYO GEMINI API KEY
            </span>
            <h3 className="text-sm font-black text-foreground">
              Gunakan Gemini API Key Google AI Studio Anda Sendiri
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Hubungkan API Key Google AI Studio Anda untuk transkripsi suara video asli tanpa batas antrian, kuota penuh, dan kecepatan analisis maksimal. Key tersimpan secara lokal dan aman di browser Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <span>Dapatkan Key</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <button
            type="button"
            onClick={onOpenModal}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/95"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Masukkan API Key</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          100% Client-Side Local Storage
        </span>
        <span>-</span>
        <span>Mendukung model Gemini 3.7 Flash & Multimodal Speech Audio</span>
        <span>-</span>
        <span>Fallback ke default server jika kosong</span>
      </div>
    </div>
  );
};
