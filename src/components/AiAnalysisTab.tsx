import React from 'react';
import { AlcoEditingProject, ContentRole } from '../types';
import {
  Brain,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  Sparkles,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';

interface AiAnalysisTabProps {
  project: AlcoEditingProject | null;
  onProceedToPreview: () => void;
}

const ROLE_BADGE_STYLES: Record<
  ContentRole,
  { label: string; bg: string; text: string; border: string }
> = {
  hook: {
    label: 'HOOK (0-3s)',
    bg: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
  problem: {
    label: 'PROBLEM',
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  curiosity: {
    label: 'CURIOSITY LOOP',
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  explanation: {
    label: 'EXPLANATION',
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  solution: {
    label: 'SOLUTION',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  proof: {
    label: 'PROOF / STATS',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
  cta: {
    label: 'CALL TO ACTION',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
};

export const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({ project, onProceedToPreview }) => {
  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm">Belum ada data analisis. Silakan kembali ke tab Input dan jalankan analisis.</p>
      </div>
    );
  }

  const { transcript, analysis, stats, creative_audit, funnel_stage } = project;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. ANALYSIS SUMMARY */}
      <div className="alco-card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                ANALYSIS SUMMARY
              </span>
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground uppercase">
                STAGE: {funnel_stage || 'META_ADS'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {project.video_type.toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-black text-foreground">{project.title}</h2>
            <p className="text-xs text-muted-foreground">
              Evaluasi mendalam pacing, hook retention, variasi visual, dan kepatuhan safe zone 9:16.
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div className="flex items-center gap-3">
            <div className="min-w-[95px] rounded-lg border border-border bg-secondary p-2.5 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Hook Score</div>
              <div className="flex items-center justify-center gap-1 text-base font-black text-rose-500 mt-0.5">
                <Flame className="w-4 h-4" />
                {stats?.hook_strength || 92}/100
              </div>
            </div>

            <div className="min-w-[95px] rounded-lg border border-border bg-secondary p-2.5 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Audit Score</div>
              <div className="flex items-center justify-center gap-1 text-base font-black text-amber-500 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
                {creative_audit?.overallScore || 90} ({creative_audit?.grade || 'A+'})
              </div>
            </div>

            <div className="min-w-[95px] rounded-lg border border-border bg-secondary p-2.5 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Visual Variety</div>
              <div className="flex items-center justify-center gap-1 text-base font-black text-emerald-500 mt-0.5">
                <Award className="w-4 h-4" />
                {stats?.visual_variety || 85}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT & FUNNEL UNDERSTANDING */}
      <div className="alco-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="alco-section-label">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span>Content & Funnel Understanding</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {analysis.length} Segmentasi Peran Konten
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analysis.map((item, idx) => {
            const roleInfo = ROLE_BADGE_STYLES[item.content_role] || ROLE_BADGE_STYLES.explanation;
            return (
              <div
                key={item.id || idx}
                className="rounded-lg border border-border bg-secondary/50 p-3.5 space-y-2.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}
                  >
                    {roleInfo.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {item.start.toFixed(1)}s - {item.end.toFixed(1)}s
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="text-muted-foreground font-normal">Keyword:</span>
                    <span className="text-primary font-bold">"{item.key_phrase}"</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                    {item.reasoning}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                  <span>
                    Emosi: <span className="font-semibold text-foreground uppercase">{item.emotion}</span>
                  </span>
                  <span>
                    Bobot: <span className="font-bold text-amber-500">{item.importance}/10</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SCENE BREAKDOWN (TRANSCRIPT SEGMENTS) */}
      <div className="alco-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="alco-section-label">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Scene Breakdown & Real-Time Transcript</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {transcript.length} Segmen Terdeteksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {transcript.map((seg, idx) => (
            <div
              key={seg.id || idx}
              className="rounded-lg border border-border bg-card p-3 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">
                  {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Durasi: {(seg.end - seg.start).toFixed(1)}s
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-foreground">
                "{seg.text}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EDITING RECOMMENDATIONS & QUALITY AUDIT */}
      {creative_audit && (
        <div className="alco-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="alco-section-label">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Editing Recommendations & Validation</span>
            </div>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 font-mono">
              Grade {creative_audit.grade} ({creative_audit.overallScore}/100)
            </span>
          </div>

          {/* 6 Category Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">Hook Retention</span>
              <span className="text-xs font-bold text-rose-500">{creative_audit.categoryScores.hookStrength}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">Readability</span>
              <span className="text-xs font-bold text-amber-500">{creative_audit.categoryScores.captionReadability}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">Proof Presence</span>
              <span className="text-xs font-bold text-blue-500">{creative_audit.categoryScores.proofPresence}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">CTA Clarity</span>
              <span className="text-xs font-bold text-indigo-500">{creative_audit.categoryScores.ctaClarity}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">Fatigue Control</span>
              <span className="text-xs font-bold text-purple-500">{creative_audit.categoryScores.fatigueRiskControl}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2 text-center">
              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">9:16 Safe Zone</span>
              <span className="text-xs font-bold text-emerald-500">{creative_audit.categoryScores.safeZoneCompliance}%</span>
            </div>
          </div>

          {/* Actionable Recommendations List */}
          <div className="space-y-2 pt-1">
            {creative_audit.recommendations.map((rec) => {
              let icon = <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />;
              let badgeStyle = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
              if (rec.severity === 'high') {
                icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
              } else if (rec.severity === 'medium') {
                icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
              } else if (rec.severity === 'passed') {
                icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
              }

              return (
                <div
                  key={rec.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/60 p-3"
                >
                  <div className="flex items-start gap-2.5">
                    {icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{rec.title}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${badgeStyle}`}>
                          {rec.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{rec.description}</p>
                      {rec.actionableFix && (
                        <p className="mt-1 text-[11px] font-semibold text-primary">
                          Saran Perbaikan: {rec.actionableFix}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom CTA to proceed to Edit & Preview */}
      <div className="alco-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-foreground">Analisis AI Selesai Disiapkan</p>
          <p className="text-[11px] text-muted-foreground">
            Buka workspace editing untuk melihat timeline interaktif, kamera zoom, dan property inspector.
          </p>
        </div>

        <button
          id="btn-proceed-to-edit-plan"
          onClick={onProceedToPreview}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
        >
          <span>Lanjut ke Edit & Preview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
