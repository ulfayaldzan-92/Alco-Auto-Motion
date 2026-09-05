import React, { useRef, useState } from 'react';
import { Upload, Film, FileText, Target, Zap, Sparkles, CheckCircle2, RefreshCw, Video, Check, RotateCcw } from 'lucide-react';
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
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* BYO Gemini API Key Onboarding Card */}
      <ApiKeyOnboardingCard onOpenModal={onOpenApiKeyModal} />

      {/* Testing Goal Banner based on Blueprint */}
      <div className="alco-card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Blueprint MVP Validation
              </span>
              <h2 className="text-base font-black text-foreground">4 Kunci Pengujian Alco Auto Motion</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Validasi pemahaman AI terhadap makna konten, segmentasi Hook/Problem/CTA, 6 motion camera presets, dynamic caption & auto B-roll.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-slate-700">
              AI Content Understanding
            </span>
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-slate-700">
              Scene Segmentation
            </span>
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-slate-700">
              6 Motion Presets
            </span>
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-slate-700">
              Dynamic Captions & B-Roll
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Video Input & Samples (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Module 1: Video Upload & Preset Selector */}
          <div className="alco-card space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  1A
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Upload Video Mentah</h3>
                  <p className="text-xs text-muted-foreground">MP4, 30-60 detik, format utama 9:16</p>
                </div>
              </div>
              {videoDuration > 0 && (
                <span className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {videoDuration}s Video Ready
                </span>
              )}
            </div>

            {/* Custom Video Active / Restore Callout */}
            {uploadedFile && selectedSampleId !== 'custom' && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-xs animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="truncate font-semibold text-foreground">Video Upload Anda Tersimpan</p>
                    <p className="truncate text-[11px] text-muted-foreground">{uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRestoreUploadedFile}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/95"
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
                  ? 'border-emerald-300 bg-emerald-50 shadow-xs'
                  : isDragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-slate-300 bg-slate-50 hover:border-primary/60 hover:bg-primary/5'
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
                       ? 'border border-emerald-200 bg-emerald-100 text-emerald-700'
                       : 'bg-secondary text-primary'
                  }`}
                >
                  {selectedSampleId === 'custom' && uploadedFile ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedSampleId === 'custom' && uploadedFile
                       ? uploadedFile.name
                       : 'Klik untuk Upload atau Drag & Drop Video MP4'}
                  </p>
                  {selectedSampleId === 'custom' && uploadedFile ? (
                    <p className="mt-0.5 text-xs font-medium text-emerald-700">
                      Tersimpan aktif di sesi browser ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB) - Klik untuk ganti
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Maksimal 60 detik (Talking-head 9:16)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Video Metadata specs if loaded */}
            {videoMeta && (
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary p-3 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground">DURASI</span>
                  <span className="font-semibold text-foreground">{videoDuration} Detik</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground">RESOLUSI</span>
                  <span className="font-semibold text-foreground">
                    {videoMeta.width} x {videoMeta.height}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground">ASPECT RATIO</span>
                  <span className="font-semibold text-primary">{videoMeta.aspect}</span>
                </div>
              </div>
            )}

            {/* Fast Test: Pre-loaded Demo Talking-Head Videos */}
            <div className="space-y-3 border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  Atau Pilih Demo Video Siap Uji (1-Click Test):
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_VIDEOS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border p-2.5 text-left transition-all ${
                      selectedSampleId === sample.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-primary">
                        {sample.contentType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{sample.duration}s</span>
                    </div>
                    <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                      {sample.title}
                    </p>
                    {selectedSampleId === sample.id && (
                      <div className="absolute bottom-1 right-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module 1B: Content Type Selection */}
          <div className="alco-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-sm font-bold text-amber-700">
                  1B
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Pilih Gaya Editing (Editing Grammar)</h3>
                  <p className="text-xs text-muted-foreground">AI mengatur pacing, intensitas kamera zoom, caption, dan density B-roll</p>
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
                    className={`relative cursor-pointer rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{item.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{item.desc}</p>
                    <span className="mt-2 inline-block rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
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
          <div className="alco-card space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                  1C
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Script & Tujuan Video</h3>
                  <p className="text-xs text-muted-foreground">Transkripsi atau naskah dialog video</p>
                </div>
              </div>
            </div>

            {/* Script Textarea & Audio Mode Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Script / Dialog Transkrip:
                </label>
                {videoFile ? (
                  <span className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Transkrip Suara Audio Asli Aktif
                  </span>
                ) : (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Mode Preset Script
                  </span>
                )}
              </div>
              
              {videoFile && (
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-[11px] leading-relaxed text-slate-700">
                  <span className="text-sm shrink-0">Audio</span>
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
                className="w-full resize-none rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Optional Goal & CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Target className="w-3 h-3 text-accent" />
                  Tujuan Video (Opsional):
                </label>
                <input
                  type="text"
                  value={videoGoal}
                  onChange={(e) => setVideoGoal(e.target.value)}
                  placeholder="Misal: Validasi pasar sebelum bikin produk"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Zap className="w-3 h-3 text-primary" />
                  CTA Video (Opsional):
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Misal: Klik link di bio / Keranjang kuning"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Testing Phase Selector from Blueprint */}
            <div className="space-y-2 border-t border-border pt-3">
              <span className="block text-xs font-semibold text-foreground">
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
                    className={`rounded-lg border p-2 text-left transition-all ${
                      activeTestingPhase === item.phase
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground">{item.sub}</div>
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
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
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
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      {activeStep?.subtitle || 'Menganalisis pacing video...'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-primary">
                      {Math.round(processingState.overallProgress)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-card">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, processingState.overallProgress))}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
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
