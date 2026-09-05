import React, { useState } from 'react';
import {
  SceneEditPlan,
  MotionPreset,
  CaptionPreset,
  CaptionDisplayMode,
  CaptionMode,
  ContentRole,
  SoundEffectType,
  VisualIntent,
} from '../types';
import { EXTENDED_STOCK_CATALOG } from '../engine/stockCatalog';
import { playSoundEffect } from '../utils/audioEffects';
import { generateWordTimings, formatCaptionByMode } from '../engine/captionEngine';
import {
  Sparkles,
  RefreshCw,
  Video,
  Volume2,
  Type,
  Move,
  Trash2,
  Flame,
  ShieldAlert,
  Sliders,
  Play,
  Layers,
  Zap,
  UserCheck,
  Eye,
  ShieldCheck,
  Sun,
} from 'lucide-react';

interface SceneInspectorProps {
  scene: SceneEditPlan | null;
  sceneIndex: number;
  onUpdateScene: (updated: SceneEditPlan) => void;
  onRegenerateScene: (sceneIndex: number, customInstruction: string) => Promise<void>;
  isRegenerating: boolean;
}

const MOTION_OPTIONS: { id: MotionPreset; label: string; desc: string }[] = [
  { id: 'normal', label: '01 NORMAL', desc: '1.0x baseline steady camera' },
  { id: 'slow_zoom_in', label: '02 SLOW_ZOOM_IN', desc: 'Slow push-in (1.0 -> 1.12x)' },
  { id: 'slow_zoom_out', label: '03 SLOW_ZOOM_OUT', desc: 'Slow pull-out (1.12 -> 1.0x)' },
  { id: 'punch_zoom', label: '04 PUNCH_ZOOM', desc: 'Instant punch zoom (1.18 - 1.25x)' },
  { id: 'pan_left', label: '05 PAN_LEFT', desc: 'Cinematic dynamic pan left' },
  { id: 'pan_right', label: '06 PAN_RIGHT', desc: 'Cinematic dynamic pan right' },
];

const CAPTION_OPTIONS: { id: CaptionPreset; label: string; desc: string }[] = [
  { id: 'hook', label: 'HOOK BADGE', desc: 'Giant high-contrast boxed badge' },
  { id: 'highlight', label: 'HIGHLIGHT', desc: 'Dynamic yellow/cyan word emphasis' },
  { id: 'normal', label: 'NORMAL', desc: 'Clean readable frosted pill' },
];

const VISUAL_INTENTS: { id: VisualIntent; label: string }[] = [
  { id: 'none', label: 'None (Focus Face)' },
  { id: 'proof', label: 'Proof / Data' },
  { id: 'metaphor', label: 'Metaphor / Concept' },
  { id: 'process', label: 'Process / Action' },
  { id: 'contrast', label: 'Contrast / Before-After' },
  { id: 'product', label: 'Product / Demo' },
  { id: 'result', label: 'Result / Success' },
  { id: 'urgency', label: 'Urgency / Alert' },
];

const ROLE_OPTIONS: ContentRole[] = ['hook', 'problem', 'curiosity', 'solution', 'proof', 'cta'];

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  scene,
  sceneIndex,
  onUpdateScene,
  onRegenerateScene,
  isRegenerating,
}) => {
  const [customAiPrompt, setCustomAiPrompt] = useState<string>('');
  const [showStockPicker, setShowStockPicker] = useState<boolean>(false);
  const [stockSearchFilter, setStockSearchFilter] = useState<string>('');

  if (!scene) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-xs">
        Pilih scene pada timeline untuk menginspeksi dan menyetel keputusan AI Director.
      </div>
    );
  }

  const scores = scene.scores || {
    hook_strength: scene.role === 'hook' ? 92 : 60,
    emotional_intensity: 6,
    visual_fatigue_risk: 30,
    urgency_level: 5,
    proof_strength: 5,
  };

  const handleRoleChange = (role: ContentRole) => {
    onUpdateScene({ ...scene, role });
  };

  const handleMotionChange = (motion: MotionPreset) => {
    let scale = scene.motion_scale;
    if (motion === 'punch_zoom') scale = 1.2;
    else if (motion === 'slow_zoom_in' || motion === 'slow_zoom_out') scale = 1.12;
    else if (motion === 'normal') scale = 1.0;
    onUpdateScene({ ...scene, motion, motion_scale: scale });
  };

  const handleCaptionTextChange = (caption: string) => {
    const segDur = Math.max(0.5, scene.end - scene.start);
    const timings = generateWordTimings(caption, segDur, scene.highlight_words || []);
    onUpdateScene({ ...scene, caption, word_timings: timings });
  };

  const handleCaptionStyleChange = (caption_style: CaptionPreset) => {
    onUpdateScene({ ...scene, caption_style });
  };

  const handleCaptionModeChange = (mode: CaptionMode) => {
    const baseText = scene.caption;
    const formatted = formatCaptionByMode(baseText, mode, scene.role);
    const segDur = Math.max(0.5, scene.end - scene.start);
    const timings = generateWordTimings(formatted, segDur, scene.highlight_words || []);
    onUpdateScene({ ...scene, caption: formatted, caption_mode: mode, word_timings: timings });
  };

  const handleHighlightWordsChange = (wordsStr: string) => {
    const words = wordsStr
      .split(',')
      .map((w) => w.trim().toUpperCase())
      .filter(Boolean);
    const segDur = Math.max(0.5, scene.end - scene.start);
    const timings = generateWordTimings(scene.caption, segDur, words);
    onUpdateScene({ ...scene, highlight_words: words, word_timings: timings });
  };

  const handleVisualIntentChange = (intent: VisualIntent) => {
    if (intent === 'none') {
      onUpdateScene({ ...scene, visual_intent: 'none', broll: null });
    } else {
      const match =
        EXTENDED_STOCK_CATALOG.find((item) => item.intent === intent) || EXTENDED_STOCK_CATALOG[0];
      onUpdateScene({
        ...scene,
        visual_intent: intent,
        broll: {
          query: match.title,
          title: match.title,
          sourceUrl: match.url,
          previewUrl: match.thumb,
          mediaType: match.type,
          visual_intent: intent,
          overlay_style: match.suggestedFraming || 'pip',
          opacity: 0.95,
        },
      });
    }
  };

  const handleSoundEffectChange = (sound_effect: SoundEffectType) => {
    onUpdateScene({ ...scene, sound_effect });
    if (sound_effect !== 'none') {
      playSoundEffect(sound_effect, 0.4);
    }
  };

  const handleRegenClick = async () => {
    await onRegenerateScene(sceneIndex, customAiPrompt);
  };

  const filteredCatalog = EXTENDED_STOCK_CATALOG.filter((item) => {
    if (!stockSearchFilter) return true;
    const q = stockSearchFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.intent.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header with Scene info & Intelligence Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              #{sceneIndex + 1}
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Scene {sceneIndex + 1} Intelligence Inspector
            </h3>
          </div>
          <p className="text-xs font-mono text-indigo-600 mt-0.5">
            {scene.start.toFixed(2)}s — {scene.end.toFixed(2)}s (Duration: {(scene.end - scene.start).toFixed(1)}s)
          </p>
        </div>

        {/* AI Director Note */}
        {scene.director_note && (
          <div className="sm:text-right max-w-sm">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Rationale:</span>
            <p className="text-[11px] text-slate-600 italic line-clamp-2">"{scene.director_note}"</p>
          </div>
        )}
      </div>

      {/* Intelligence Score Meters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500" /> Hook Strength
            </span>
            <span className="font-mono font-bold text-slate-900">{scores.hook_strength}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                scores.hook_strength >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${scores.hook_strength}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Fatigue Risk
            </span>
            <span className="font-mono font-bold text-slate-900">{scores.visual_fatigue_risk}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                scores.visual_fatigue_risk > 50 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${scores.visual_fatigue_risk}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-500" /> Emotional Energy
            </span>
            <span className="font-mono font-bold text-slate-900">{scores.emotional_intensity}/10</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${scores.emotional_intensity * 10}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-500" /> Urgency
            </span>
            <span className="font-mono font-bold text-slate-900">{scores.urgency_level}/10</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${scores.urgency_level * 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Talking Head Intelligence & Eyeline Safeguards Banner */}
      {scene.talking_head_framing && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-800/60 rounded-xl p-3 text-white space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-indigo-800/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">Talking Head Intelligence</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                    scene.talking_head_framing.protection_status === 'SAFE_FALLBACK'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  }`}>
                    {scene.talking_head_framing.protection_status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">{scene.talking_head_framing.note}</p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/50 px-2 py-1 rounded border border-indigo-700/50">
              {Math.round(scene.talking_head_framing.confidence * 100)}% Detection Confidence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-indigo-900/40">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" /> Eyeline Alignment
              </span>
              <span className="font-bold text-emerald-300 font-mono">
                Upper 1/3 ({scene.talking_head_framing.eyeline_y_percent}%)
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-indigo-900/40">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> Headroom Protection
              </span>
              <span className="font-bold text-indigo-200 font-mono">
                {scene.talking_head_framing.headroom_percent}% Headroom Buffer
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-indigo-900/40">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase flex items-center gap-1">
                <Move className="w-3 h-3 text-amber-400" /> Smart Reframe Scale
              </span>
              <span className="font-bold text-amber-300 font-mono">
                {scene.talking_head_framing.smart_reframe_scale}x (Face Safe)
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-indigo-900/40">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase flex items-center gap-1">
                <Sliders className="w-3 h-3 text-rose-400" /> Framing Mode
              </span>
              <span className="font-bold text-slate-200 capitalize truncate block">
                {scene.talking_head_framing.framing_mode.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Quality & Lighting Correction Card */}
      {scene.visual_correction && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Sun className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">Lighting & Visual Quality Correction</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                    {scene.visual_correction.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">{scene.visual_correction.note}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Brightness / Fill Light</span>
              <span className="font-bold text-amber-300 font-mono">{scene.visual_correction.brightness}%</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Contrast Clarity</span>
              <span className="font-bold text-cyan-300 font-mono">{scene.visual_correction.contrast}%</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Skin Warmth / Saturation</span>
              <span className="font-bold text-emerald-300 font-mono">{scene.visual_correction.saturate}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Role & Motion Presets */}
        <div className="space-y-4">
          {/* Content Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Content Role:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                    scene.role === role
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Motion Presets Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-indigo-600" />
                Motion Camera Preset (6 Presets):
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Scale: {scene.motion_scale?.toFixed(2) || '1.15'}x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {MOTION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleMotionChange(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    scene.motion === opt.id
                      ? 'border-indigo-500 bg-indigo-50/60 text-slate-900 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-800">{opt.label}</div>
                  <div className="text-[9px] text-slate-500 line-clamp-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effect & Transition */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" /> Sound FX:
                </label>
                {scene.sound_effect !== 'none' && (
                  <button
                    type="button"
                    onClick={() => playSoundEffect(scene.sound_effect, 0.5)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Test
                  </button>
                )}
              </div>
              <select
                value={scene.sound_effect}
                onChange={(e) => handleSoundEffectChange(e.target.value as SoundEffectType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="none">None</option>
                <option value="whoosh">Whoosh (Fast Swipe)</option>
                <option value="pop">Pop (Punch Snap)</option>
                <option value="ding">Ding (Success/Proof)</option>
                <option value="camera_shutter">Camera Shutter</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Transition:</label>
              <select
                value={scene.transition}
                onChange={(e) => onUpdateScene({ ...scene, transition: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="cut">Hard Cut</option>
                <option value="flash">Impact Flash</option>
                <option value="whip_pan">Whip Pan</option>
                <option value="zoom_cut">Zoom Cut</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Captions, Visual Intent & B-Roll */}
        <div className="space-y-4">
          {/* Caption Text & Style */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-600" /> Caption Text & Mode:
              </label>
              {/* Caption Modes (Verbatim / Punchy / Summary) */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                {(['verbatim', 'punchy', 'summary'] as CaptionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleCaptionModeChange(mode)}
                    className={`px-2 py-0.5 rounded font-bold capitalize cursor-pointer ${
                      scene.caption_mode === mode
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={scene.caption}
              onChange={(e) => handleCaptionTextChange(e.target.value)}
              placeholder="Caption text on screen..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            />

            {/* 3 Caption Styles */}
            <div className="grid grid-cols-3 gap-1.5">
              {CAPTION_OPTIONS.map((cOpt) => (
                <button
                  key={cOpt.id}
                  type="button"
                  onClick={() => handleCaptionStyleChange(cOpt.id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center cursor-pointer ${
                    scene.caption_style === cOpt.id
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cOpt.label}
                </button>
              ))}
            </div>

            {/* Caption Display Mode */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 font-medium">Caption Layout & Display Mode:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'clean_floating', label: 'Clean Floating' },
                  { id: 'hook_headline', label: 'Hook Headline' },
                  { id: 'proof_badge', label: 'Proof Badge Box' },
                  { id: 'cta_emphasis', label: 'CTA Emphasis' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onUpdateScene(scene.id, { caption_display_mode: mode.id as CaptionDisplayMode })}
                    className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all text-center cursor-pointer ${
                      (scene.caption_display_mode || 'clean_floating') === mode.id
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 font-bold'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlighted Words input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 font-medium">
                Highlighted Words (comma separated):
              </label>
              <input
                type="text"
                value={(scene.highlight_words || []).join(', ')}
                onChange={(e) => handleHighlightWordsChange(e.target.value)}
                placeholder="SALAH, PRODUK, CEPAT"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-amber-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Visual Intent & B-Roll Framing */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Visual Intent:
              </label>
              {scene.broll && (
                <button
                  onClick={() => onUpdateScene({ ...scene, broll: null, visual_intent: 'none' })}
                  className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" /> Remove B-roll
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={scene.visual_intent || 'none'}
                onChange={(e) => handleVisualIntentChange(e.target.value as VisualIntent)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {VISUAL_INTENTS.map((intent) => (
                  <option key={intent.id} value={intent.id}>
                    {intent.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowStockPicker(!showStockPicker)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 cursor-pointer flex items-center justify-center gap-1"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Stock Library</span>
              </button>
            </div>

            {/* Curated Extended Stock Picker */}
            {showStockPicker && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-lg animate-fade-in">
                <input
                  type="text"
                  value={stockSearchFilter}
                  onChange={(e) => setStockSearchFilter(e.target.value)}
                  placeholder="Cari stock b-roll (contoh: sales, frustration, mobile)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCatalog.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onUpdateScene({
                          ...scene,
                          visual_intent: item.intent,
                          broll: {
                            query: item.title,
                            title: item.title,
                            sourceUrl: item.url,
                            previewUrl: item.thumb,
                            mediaType: item.type,
                            visual_intent: item.intent,
                            overlay_style: item.suggestedFraming || 'pip',
                            opacity: 0.95,
                          },
                        });
                        setShowStockPicker(false);
                      }}
                      className="p-1 rounded-lg border border-slate-200 hover:border-indigo-500 bg-slate-50 text-left text-[9px] text-slate-700 space-y-1 cursor-pointer hover:bg-indigo-50/40 transition-all"
                    >
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full aspect-video object-cover rounded"
                      />
                      <span className="block truncate font-bold">{item.title}</span>
                      <span className="text-[8px] text-indigo-600 block">{item.intent}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Scene Regenerator Section */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div className="flex-1">
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            placeholder="AI instruction: Increase hook energy / make punch zoom faster..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          disabled={isRegenerating}
          onClick={handleRegenClick}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Regenerating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regenerate Scene</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
