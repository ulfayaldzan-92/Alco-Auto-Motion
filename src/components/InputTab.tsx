import React, { useRef, useState } from 'react';
import { Upload, Film, FileText, Target, Zap, Play, Sparkles, CheckCircle2, AlertCircle, Clock, RefreshCw, Video, Check, RotateCcw } from 'lucide-react';
import { ContentType, SampleVideoOption, ProcessingState } from '../types';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { ApiKeyOnboardingCard } from './ApiKeyOnboardingCard';

interface InputTabProps {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  rawScript: string;
  setRawScript: (script: string) => void;
  videoGoal: string;
  setVideoGoal: (goal: string) => void;
  ctaText: string;
  setCtaText: (cta: string) => void;
  videoUrl: string;
  videoFile: File | null;
  uploadedFile: File | null;
  uploadedUrl: string | null;
  selectedSampleId: string;
  onSelectSample: (sample: SampleVideoOption) => void;
  onUploadCustomFile: (file: File) => void;
  onRestoreUploadedFile: () => void;
  videoDuration: number;
  setVideoDuration: (dur: number) => void;
  videoMeta: { width: number; height: number; aspect: string } | null;
  setVideoMeta: (meta: { width: number; height: number; aspect: string } | null) => void;
  onStartAnalysis: (sampleOverride?: SampleVideoOption) => void;
  processingState: ProcessingState;
  onOpenApiKeyModal: () => void;
}

export const InputTab: React.FC<InputTabProps> = ({
  contentType,
  setContentType,
  rawScript,
  setRawScript,
  videoGoal,
  setVideoGoal,
  ctaText,
  setCtaText,
  videoUrl,
  videoFile,
  uploadedFile,
  uploadedUrl,
  selectedSampleId,
  onSelectSample,
  onUploadCustomFile,
  onRestoreUploadedFile,
  videoDuration,
  setVideoDuration,
  videoMeta,
  setVideoMeta,
  onStartAnalysis,
  processingState,
  onOpenApiKeyModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [activeTestingPhase, setActiveTestingPhase] = useState<number>(4);

  const isProcessing = processingState.isProcessing;
  const activeStep = processingState.steps.find((s) => s.status === 'running') || processingState.steps[0];

  const handleFileUpload = (file: File) => {
    onUploadCustomFile(file);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* BYO Gemini API Key Onboarding Card */}
      <ApiKeyOnboardingCard onOpenModal={onOpenApiKeyModal} />

      {/* Testing Goal Banner based on Blueprint */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Blueprint MVP Validation
              </span>
              <h2 className="text-base font-semibold text-white">4 Kunci Pengujian Alco Auto Motion</h2>
            </div>
            <p className="text-xs text-slate-300">
              Validasi pemahaman AI terhadap makna konten, segmentasi Hook/Problem/CTA, 6 motion camera presets, dynamic caption & auto B-roll.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700">
              ✓ AI Content Understanding
            </span>
            <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700">
              ✓ Scene Segmentation
            </span>
            <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700">
              ✓ 6 Motion Presets
            </span>
            <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700">
              ✓ Dynamic Captions & B-Roll
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video Input & Samples (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Module 1: Video Upload & Preset Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  1A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Video Mentah</h3>
                  <p className="text-xs text-slate-400">MP4, 30–60 detik, format utama 9:16</p>
                </div>
              </div>
              {videoDuration > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {videoDuration}s Video Ready
                </span>
              )}
            </div>

            {/* Custom Video Active / Restore Callout */}
            {uploadedFile && selectedSampleId !== 'custom' && (
              <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">Video Upload Anda Tersimpan</p>
                    <p className="text-[11px] text-indigo-200 truncate">{uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRestoreUploadedFile}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Gunakan Video Saya</span>
                </button>
              </div>
            )}

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(e.dataTransfer.types.includes('Files'));
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedSampleId === 'custom' && uploadedFile
                  ? 'border-emerald-500/80 bg-emerald-950/20 shadow-xs'
                  : isDragOver
                  ? 'border-indigo-400 bg-indigo-950/40'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    selectedSampleId === 'custom' && uploadedFile
                      ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50'
                      : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  {selectedSampleId === 'custom' && uploadedFile ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {selectedSampleId === 'custom' && uploadedFile
                      ? `✓ ${uploadedFile.name}`
                      : 'Klik untuk Upload atau Drag & Drop Video MP4'}
                  </p>
                  {selectedSampleId === 'custom' && uploadedFile ? (
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      Tersimpan aktif di sesi browser ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB) • Klik untuk ganti
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Maksimal 60 detik (Talking-head 9:16)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Video Metadata specs if loaded */}
            {videoMeta && (
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">DURASI</span>
                  <span className="font-semibold text-slate-200">{videoDuration} Detik</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RESOLUSI</span>
                  <span className="font-semibold text-slate-200">
                    {videoMeta.width} x {videoMeta.height}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ASPECT RATIO</span>
                  <span className="font-semibold text-amber-400">{videoMeta.aspect}</span>
                </div>
              </div>
            )}

            {/* Fast Test: Pre-loaded Demo Talking-Head Videos */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  Atau Pilih Demo Video Siap Uji (1-Click Test):
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_VIDEOS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className={`text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                      selectedSampleId === sample.id
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {sample.contentType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">{sample.duration}s</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight">
                      {sample.title}
                    </p>
                    {selectedSampleId === sample.id && (
                      <div className="absolute bottom-1 right-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module 1B: Content Type Selection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  1B
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pilih Gaya Editing (Editing Grammar)</h3>
                  <p className="text-xs text-slate-400">AI mengatur pacing, intensitas kamera zoom, caption, dan density B-roll</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'meta_ads', label: 'Meta Ads (Direct Response)', desc: 'Hook-Problem-Proof-CTA Funnel, ROAS & CTR Focus', tag: 'Top ROI' },
                { id: 'fast_tiktok', label: 'Fast TikTok / Reels', desc: 'Punch Zooms 1.25x, Flash Cuts & Whoosh SFX', tag: 'Viral' },
                { id: 'clean_creator', label: 'Clean Creator', desc: 'Natural 1.10x push-in, Authentic Talking-Head', tag: 'Human' },
                { id: 'educational', label: 'Educational / Authority', desc: 'Concept Breakdown, Split Diagrams & Process Map', tag: 'Expert' },
                { id: 'storytelling', label: 'Storytelling / Cinematic', desc: 'Emotional Arc, Metaphor Overlays & Dramatic Pauses', tag: 'Cinematic' },
                { id: 'affiliate', label: 'Affiliate / Showcase', desc: 'Product In-Use Demos, Feature Highlights & Shop Cues', tag: 'Sales' },
              ].map((item) => {
                const isSelected = contentType === item.id || (item.id === 'fast_tiktok' && contentType === 'reels_tiktok') || (item.id === 'educational' && contentType === 'education');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContentType(item.id as ContentType)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-md ring-1 ring-amber-400/40'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100">{item.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{item.desc}</p>
                    <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-amber-300">
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Script & Objectives (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  1C
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Script & Tujuan Video</h3>
                  <p className="text-xs text-slate-400">Transkripsi atau naskah dialog video</p>
                </div>
              </div>
            </div>

            {/* Script Textarea & Audio Mode Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Script / Dialog Transkrip:
                </label>
                {videoFile ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Transkrip Suara Audio Asli Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    Mode Preset Script
                  </span>
                )}
              </div>
              
              {videoFile && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-200/90 leading-relaxed flex items-start gap-2">
                  <span className="text-sm shrink-0">🎙️</span>
                  <span>
                    <strong>Prioritas Audio Video:</strong> Sistem otomatis mengekstrak & mentranskripsi ucapan langsung dari suara asli video secara verbatim. Teks di bawah otomatis terupdate atau dapat digunakan sebagai konteks assist/fallback.
                  </span>
                </div>
              )}

              <textarea
                value={rawScript}
                onChange={(e) => setRawScript(e.target.value)}
                placeholder={videoFile ? "Transkrip suara otomatis diekstrak saat generate, atau ketik naskah referensi disini..." : "Masukkan transkrip atau naskah video disini..."}
                rows={videoFile ? 4 : 5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
              />
            </div>

            {/* Optional Goal & CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  Tujuan Video (Opsional):
                </label>
                <input
                  type="text"
                  value={videoGoal}
                  onChange={(e) => setVideoGoal(e.target.value)}
                  placeholder="Misal: Validasi pasar sebelum bikin produk"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-400" />
                  CTA Video (Opsional):
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Misal: Klik link di bio / Keranjang kuning"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Testing Phase Selector from Blueprint */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Fase Pengujian (Testing Level):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { phase: 1, title: 'Test 1: AI Director', sub: 'Keputusan editing JSON' },
                  { phase: 2, title: 'Test 2: Zoom + Captions', sub: 'Motion zoom & highlight' },
                  { phase: 3, title: 'Test 3: + Auto B-Roll', sub: 'Stock video overlays' },
                  { phase: 4, title: 'Test 4: Full Auto Preview', sub: 'Semua efek & render' },
                ].map((item) => (
                  <button
                    key={item.phase}
                    type="button"
                    onClick={() => setActiveTestingPhase(item.phase)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      activeTestingPhase === item.phase
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                        : 'border-slate-800/80 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-slate-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button & Live Status */}
            <div className="space-y-3 pt-1">
              <button
                id="btn-analyze-video"
                type="button"
                disabled={isProcessing}
                onClick={() => onStartAnalysis()}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {activeStep?.title || 'Sedang Memproses AI Director...'} ({Math.round(processingState.overallProgress)}%)
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ANALYZE & GENERATE EDIT PLAN</span>
                  </>
                )}
              </button>

              {/* Inline Progress Strip if running */}
              {isProcessing && (
                <div className="bg-slate-950/90 border border-indigo-900/60 rounded-xl p-3 space-y-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      {activeStep?.subtitle || 'Menganalisis pacing video...'}
                    </span>
                    <span className="text-amber-400 font-mono text-[11px] font-bold">
                      {Math.round(processingState.overallProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, processingState.overallProgress))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Tahap: {activeStep?.id || 'Analisis'}</span>
                    <span>Waktu: {(processingState.elapsedMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
