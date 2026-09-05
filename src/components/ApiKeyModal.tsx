import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  removeStoredApiKey,
  validateApiKey,
  getMaskedApiKey,
} from '../services/apiKeyService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [maskedCurrentKey, setMaskedCurrentKey] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      if (stored) {
        setApiKeyInput(stored);
        setHasCustomKey(true);
        setMaskedCurrentKey(getMaskedApiKey(stored));
      } else {
        setApiKeyInput('');
        setHasCustomKey(false);
        setMaskedCurrentKey('');
      }
      setValidationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setValidationResult({
        success: false,
        message: 'Masukkan API Key terlebih dahulu sebelum melakukan tes koneksi.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    const result = await validateApiKey(keyToTest);
    setIsValidating(false);
    setValidationResult({
      success: result.valid,
      message: result.message,
    });
  };

  const handleSaveKey = () => {
    const clean = apiKeyInput.trim();
    if (!clean) {
      setValidationResult({
        success: false,
        message: 'Silakan isi API Key Anda.',
      });
      return;
    }

    setStoredApiKey(clean);
    setHasCustomKey(true);
    setMaskedCurrentKey(getMaskedApiKey(clean));
    setValidationResult({
      success: true,
      message: 'API Key pribadi berhasil disimpan di browser!',
    });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRemoveKey = () => {
    removeStoredApiKey();
    setApiKeyInput('');
    setHasCustomKey(false);
    setMaskedCurrentKey('');
    setValidationResult({
      success: true,
      message: 'API Key pribadi telah dihapus. Sistem akan menggunakan server default fallback.',
    });
  };

  return (
    <div
      id="gemini-apikey-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gemini-apikey-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Pengaturan Gemini API Key
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  BYO Key
                </span>
              </h3>
              <p className="text-xs text-slate-400">Gunakan API Key Google AI Studio Anda sendiri</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs leading-relaxed text-slate-300">
          {/* Current Key Status Badge */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  hasCustomKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
                }`}
              />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Status:{' '}
                  {hasCustomKey ? (
                    <span className="text-emerald-400 font-bold">API Key Pribadi Aktif</span>
                  ) : (
                    <span className="text-amber-300 font-medium">Menggunakan Server Default</span>
                  )}
                </p>
                {hasCustomKey && maskedCurrentKey && (
                  <p className="text-[11px] font-mono text-slate-400">Key: {maskedCurrentKey}</p>
                )}
              </div>
            </div>

            {hasCustomKey && (
              <button
                type="button"
                onClick={handleRemoveKey}
                className="px-2.5 py-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus Key</span>
              </button>
            )}
          </div>

          {/* Step by step guide to get Key */}
          <div className="space-y-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Cara Dapatkan Gemini API Key Gratis:
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Buka AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
              <li>
                Buka{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                dan login dengan akun Google Anda.
              </li>
              <li>Klik tombol <strong>&quot;Create API key&quot;</strong>.</li>
              <li>Salin (*Copy*) API key yang dihasilkan dan tempelkan pada kolom di bawah ini.</li>
            </ol>
          </div>

          {/* API Key Input Form */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Masukkan API Key Gemini Anda:</span>
              <span className="text-[10px] text-slate-500 font-mono">Format: AIzaSy...</span>
            </label>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                title={showKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Validation Result Alert */}
          {validationResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
                validationResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              {validationResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-tight">{validationResult.message}</div>
            </div>
          )}

          {/* Security & Privacy Notice */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Penyimpanan Aman & Lokal</span>
            </div>
            <p>
              API Key Anda disimpan secara lokal di browser Anda (<code className="text-slate-300">localStorage</code>) dan hanya dikirimkan via header request terenkripsi untuk memproses video Anda.
            </p>
            <p className="text-amber-400/90 font-medium">
              ⚠️ Peringatan: Jangan pernah membagikan API Key Anda kepada pihak yang tidak tepercaya.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isValidating || !apiKeyInput.trim()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Koneksi</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKeyInput.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
