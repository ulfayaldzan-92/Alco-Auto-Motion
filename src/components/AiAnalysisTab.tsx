import React from 'react';
import { AlcoEditingProject, ContentRole } from '../types';
import { Sparkles, Brain, ArrowRight, ShieldCheck, Flame, Zap, CheckCircle2, Award, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AiAnalysisTabProps {
  project: AlcoEditingProject | null;
  onProceedToPreview: () => void;
}

const ROLE_BADGE_STYLES: Record<ContentRole, { label: string; bg: string; text: string; border: string }> = {
  hook: { label: 'HOOK (0-3s)', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
  problem: { label: 'PROBLEM', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  curiosity: { label: 'CURIOSITY LOOP', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  explanation: { label: 'EXPLANATION', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  solution: { label: 'SOLUTION', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  proof: { label: 'PROOF / STATS', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  cta: { label: 'CALL TO ACTION', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
};

export const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({ project, onProceedToPreview }) => {
  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        <Brain className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-sm">Belum ada analisis. Silakan kembali ke tab Input dan klik Analyze Video.</p>
      </div>
    );
  }

  const { transcript, analysis, stats, creative_audit, funnel_stage } = project;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner: Retention & Scoring */}
      <div className="alco-card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Alco Creative Performance Engine
              </span>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                STAGE: {funnel_stage || 'META_ADS'}
              </span>
              <span className="text-xs text-muted-foreground">Type: {project.video_type.toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-black text-foreground">{project.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Marketing Funnel-based auto editing: Hook → Problem → Curiosity → Solution → Proof → CTA.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="min-w-[90px] rounded-lg border border-border bg-secondary p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Hook Score</div>
              <div className="flex items-center justify-center gap-1 text-lg font-black text-rose-600">
                <Flame className="w-4 h-4 text-rose-500" />
                {stats?.hook_strength || 92}/100
              </div>
            </div>

            <div className="min-w-[90px] rounded-lg border border-border bg-secondary p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Audit Score</div>
              <div className="flex items-center justify-center gap-1 text-lg font-black text-amber-700">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                {creative_audit?.overallScore || 90}/100 ({creative_audit?.grade || 'A+'})
              </div>
            </div>

            <div className="min-w-[90px] rounded-lg border border-border bg-secondary p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Visual Diversity</div>
              <div className="flex items-center justify-center gap-1 text-lg font-black text-emerald-700">
                <Award className="w-4 h-4 text-emerald-500" />
                {stats?.visual_variety || 85}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creative Audit & Recommendations Layer (Prioritas 4) */}
      {creative_audit && (
        <div className="alco-card space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-foreground">
                Creative Validation Audit & Edit Recommendations
              </h3>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-700">
              GRADE {creative_audit.grade} ({creative_audit.overallScore}/100)
            </span>
          </div>

          {/* Category Scores Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">Hook Retention</span>
              <span className="text-sm font-black text-rose-400">{creative_audit.categoryScores.hookStrength}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">Readability</span>
              <span className="text-sm font-black text-amber-400">{creative_audit.categoryScores.captionReadability}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">Proof Presence</span>
              <span className="text-sm font-black text-blue-400">{creative_audit.categoryScores.proofPresence}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">CTA Clarity</span>
              <span className="text-sm font-black text-indigo-400">{creative_audit.categoryScores.ctaClarity}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">Fatigue Control</span>
              <span className="text-sm font-black text-purple-400">{creative_audit.categoryScores.fatigueRiskControl}%</span>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted-foreground">9:16 Safe Zone</span>
              <span className="text-sm font-black text-emerald-400">{creative_audit.categoryScores.safeZoneCompliance}%</span>
            </div>
          </div>

          {/* Actionable Fixes List */}
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-bold text-foreground">Actionable Creative Recommendations:</h4>
            {creative_audit.recommendations.map((rec) => {
              let icon = <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
              let badgeStyle = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
              if (rec.severity === 'high') {
                icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
              } else if (rec.severity === 'medium') {
                icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
              } else if (rec.severity === 'passed') {
                icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
                badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              }

              return (
                <div key={rec.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary p-3">
                  <div className="flex items-start gap-2.5">
                    {icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{rec.title}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded border ${badgeStyle}`}>
                          {rec.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{rec.description}</p>
                      <p className="mt-1 text-[11px] font-bold text-amber-700">Fix: {rec.actionableFix}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: 2 Columns - Left: Transcript & Timestamps, Right: Role Breakdown & Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Modul 2 - Transkripsi Tersegmentasi (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
                M2
              </span>
              Transkripsi Waktu Nyata
            </h3>
            <span className="text-xs text-muted-foreground">{transcript.length} Segmen Terdeteksi</span>
          </div>

          <div className="space-y-3">
            {transcript.map((seg, idx) => (
              <div
                key={seg.id || idx}
                className="space-y-2 rounded-lg border border-border bg-card p-3.5 transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono font-bold text-amber-700">
                    {seg.start.toFixed(1)}s — {seg.end.toFixed(1)}s
                  </span>
                  <span className="text-[11px] text-muted-foreground">
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

        {/* Right Column: Modul 3 - AI Content Analyzer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-accent-foreground">
                M3
              </span>
              AI Content Role & Emosi
            </h3>
            <span className="text-xs text-muted-foreground">Editing Berdasarkan Makna</span>
          </div>

          <div className="space-y-3.5">
            {analysis.map((item, idx) => {
              const roleInfo = ROLE_BADGE_STYLES[item.content_role] || ROLE_BADGE_STYLES.explanation;
              return (
                <div
                  key={item.id || idx}
                  className="space-y-2.5 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}
                      >
                        {roleInfo.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.start.toFixed(1)}s — {item.end.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        Emosi:{' '}
                        <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          {item.emotion}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Penting: <span className="font-bold text-amber-700">{item.importance}/10</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary p-2.5 text-xs">
                    <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <div>
                      <span className="block text-[11px] font-medium text-muted-foreground">
                        Kata Kunci Inti: <span className="font-bold text-amber-700">"{item.key_phrase}"</span>
                      </span>
                      <p className="mt-1 text-[11px] italic text-slate-700">
                        {item.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action to Proceed */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 pt-4">
            <div>
              <p className="text-xs font-semibold text-foreground">Analisis AI Selesai!</p>
              <p className="text-[11px] text-muted-foreground">
                Lanjut ke pembuatan motion presets, dynamic zoom, dan timeline editor.
              </p>
            </div>

            <button
              id="btn-proceed-to-edit-plan"
              onClick={onProceedToPreview}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/95"
            >
              <span>LIHAT EDIT PLAN & PREVIEW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
