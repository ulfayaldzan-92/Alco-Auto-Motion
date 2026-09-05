import React, { useState, useEffect } from 'react';
import { Key, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import {
  getStoredApiKey,
  hasCustomApiKey,
  getMaskedApiKey,
  subscribeApiKeyChanges,
} from '../services/apiKeyService';

interface ApiKeyControlProps {
  onOpenModal: () => void;
}

export const ApiKeyControl: React.FC<ApiKeyControlProps> = ({ onOpenModal }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');

  useEffect(() => {
    const updateKeyStatus = () => {
      const isSet = hasCustomApiKey();
      setHasKey(isSet);
      setMaskedKey(isSet ? getMaskedApiKey() : '');
    };

    updateKeyStatus();
    const unsubscribe = subscribeApiKeyChanges(() => {
      updateKeyStatus();
    });

    return () => unsubscribe();
  }, []);

  return (
    <button
      id="btn-apikey-control"
      type="button"
      onClick={onOpenModal}
      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
        hasKey
          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400'
          : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 animate-pulse'
      }`}
      title="Klik untuk mengatur Gemini API Key pribadi"
    >
      <div className="flex items-center gap-1.5">
        <Key className={`w-3.5 h-3.5 ${hasKey ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="font-mono text-[11px]">
          {hasKey ? `Key: ${maskedKey}` : 'Set Gemini API Key'}
        </span>
      </div>

      {hasKey ? (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      ) : (
        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold uppercase">
          BYO
        </span>
      )}
    </button>
  );
};
