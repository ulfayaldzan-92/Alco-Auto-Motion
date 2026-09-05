import React, { useRef, useState } from 'react';
import {
  Upload,
  Film,
  FileText,
  Target,
  Zap,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Video,
  Check,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
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

  const isProcessing = processingState.isProcessing;
  const activeStep =
    processingState.steps.find((s) => s.status === 'running') || processingState.steps[0];

  const handleFileUpload = (file: File) => {
    onUploadCustomFile(file);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* BYO Gemini API Key Onboarding Card */}
      <ApiKeyOnboardingCard onOpenModal={onOpenApiKeyModal} />

      {/* Workspace Context Header */}
      <div className="alco-card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                PROJECT SETUP
              </span>
              <h2 className="text-base font-bold text-foreground">
                Persiapan Sumber Video & Naskah
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Konfigurasikan rekaman mentah, transkrip, gaya editing, dan tujuan konversi untuk diarahkan oleh AI Director.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded border border-border bg-secondary px-2.5 py-1 text-muted-foreground font-mono">
              9:16 Vertical
            </span>
            <span className="rounded border border-border bg-secondary px-2.5 py-1 text-muted-foreground font-mono">
              Max 60s
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: SOURCE VIDEO & SCRIPT (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: SOURCE VIDEO */}
          <div className="alco-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="alco-section-label">
                <Video className="w-3.5 h-3.5 text-primary" />
                <span>Source Video</span>
              </div>
              {videoDuration > 0 && (
                <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {videoDuration}s Video Ready
                </span>
              )}
            </div>

            {/* Uploaded File Restore Notification */}
            {uploadedFile && selectedSampleId !== 'custom' && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Video className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">File Unggahan Anda Tersimpan</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRestoreUploadedFile}
                  className="flex shrink-0 items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Pakai Video Saya</span>
                </button>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
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
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                selectedSampleId === 'custom' && uploadedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : isDragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary'
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    selectedSampleId === 'custom' && uploadedFile
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {selectedSampleId === 'custom' && uploadedFile ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {selectedSampleId === 'custom' && uploadedFile
                      ? uploadedFile.name
                      : 'Unggah Rekaman Video (MP4 / WebM)'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedSampleId === 'custom' && uploadedFile
                      ? `Tersimpan aktif di sesi browser (${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB) - Klik untuk ganti`
                      : 'Drag & drop atau klik untuk memilih file video 9:16'}
                  </p>
                </div>
              </div>
            </div>

            {/* Video Specs Strip */}
            {videoMeta && (
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary p-2.5 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Durasi</span>
                  <span className="font-semibold text-foreground">{videoDuration}s</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Dimensi</span>
                  <span className="font-semibold text-foreground">
                    {videoMeta.width}x{videoMeta.height}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Format</span>
                  <span className="font-semibold text-primary">{videoMeta.aspect}</span>
                </div>
              </div>
            )}

            {/* Sample Presets */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-primary" />
                Atau pilih contoh video siap uji:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_VIDEOS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className={`group cursor-pointer rounded-lg border p-2.5 text-left transition-all ${
                      selectedSampleId === sample.id
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase text-primary">
                        {sample.contentType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {sample.duration}s
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs font-semibold text-foreground">
                      {sample.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: SCRIPT */}
          <div className="alco-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="alco-section-label">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Script & Dialogue Transcript</span>
              </div>
              {videoFile ? (
                <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Verbatim Audio Extraction Active
                </span>
              ) : (
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Preset Transcript
                </span>
              )}
            </div>

            {videoFile && (
              <div className="rounded-lg border border-border bg-secondary p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Audio Extraction Priority:</span> Sistem otomatis mentranskripsikan ucapan langsung dari trek audio video. Teks di bawah dapat disunting sebagai konteks koreksi.
              </div>
            )}

            <textarea
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
              placeholder="Masukkan transkrip atau naskah video di sini..."
              rows={5}
              className="w-full resize-none rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Right Column: PROJECT INPUT, CTA & ACTIONS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section: PROJECT INPUT & EDITING GRAMMAR */}
          <div className="alco-card p-5 space-y-4">
            <div className="alco-section-label">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Project Input & Grammar</span>
            </div>

            {/* Content Type / Editing Grammar Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Gaya Editing (Editing Grammar):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'meta_ads', label: 'Meta Ads', desc: 'Direct Response, ROAS Focus' },
                  { id: 'fast_tiktok', label: 'Fast TikTok / Reels', desc: 'High Intensity Zooms, Fast Pacing' },
                  { id: 'clean_creator', label: 'Clean Creator', desc: 'Natural Push-In, Talking-Head' },
                  { id: 'educational', label: 'Educational', desc: 'Authority & Clear Concept Breakdown' },
                  { id: 'storytelling', label: 'Storytelling', desc: 'Emotional Arc & Cinematic Cadence' },
                  { id: 'affiliate', label: 'Affiliate Showcase', desc: 'Product In-Use & Feature Cues' },
                ].map((item) => {
                  const isSelected =
                    contentType === item.id ||
                    (item.id === 'fast_tiktok' && contentType === 'reels_tiktok') ||
                    (item.id === 'educational' && contentType === 'education');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContentType(item.id as ContentType)}
                      className={`cursor-pointer rounded-lg border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border bg-card hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                        <span
                          className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-border'
                          }`}
                        >
                          {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground mt-0.5">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Goal */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                <span>Video Goal (Tujuan Video):</span>
              </label>
              <input
                type="text"
                value={videoGoal}
                onChange={(e) => setVideoGoal(e.target.value)}
                placeholder="Contoh: Validasi pasar sebelum peluncuran produk"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Call To Action */}
            <div className="space-y-1.5">
              <div className="alco-section-label">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Call To Action (CTA)</span>
              </div>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Contoh: Klik link di bio / Dapatkan diskon 30%"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Primary Action Button Box */}
          <div className="alco-card p-5 space-y-3">
            <button
              id="btn-analyze-video"
              type="button"
              disabled={isProcessing}
              onClick={() => onStartAnalysis()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary py-3.5 px-4 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/95 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Analisis ({Math.round(processingState.overallProgress)}%)...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Video & Generate Edit Plan</span>
                </>
              )}
            </button>

            {/* Inline Progress Bar when running */}
            {isProcessing && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    {activeStep?.title || 'Menjalankan Analisis'}
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {Math.round(processingState.overallProgress)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, processingState.overallProgress))}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {activeStep?.subtitle || 'Mengevaluasi pacing dan eyeline safe zone...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
