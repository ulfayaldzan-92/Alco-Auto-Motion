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
  Play,
  Layers,
  Zap,
  SlidersHorizontal,
  Eye,
  Sun,
  CheckCircle,
} from 'lucide-react';

interface SceneInspectorProps {
  scene: SceneEditPlan | null;
  sceneIndex: number;
  onUpdateScene: (updated: SceneEditPlan) => void;
  onRegenerateScene: (sceneIndex: number, customInstruction: string) => Promise<void>;
  isRegenerating: boolean;
}

const MOTION_OPTIONS: { id: MotionPreset; label: string; desc: string }[] = [
  { id: 'normal', label: '01 NORMAL', desc: '1.0x baseline steady' },
  { id: 'slow_zoom_in', label: '02 SLOW ZOOM IN', desc: 'Slow push-in (1.0 -> 1.12x)' },
  { id: 'slow_zoom_out', label: '03 SLOW ZOOM OUT', desc: 'Slow pull-out (1.12 -> 1.0x)' },
  { id: 'punch_zoom', label: '04 PUNCH ZOOM', desc: 'Instant punch (1.20x)' },
  { id: 'pan_left', label: '05 PAN LEFT', desc: 'Dynamic pan left' },
  { id: 'pan_right', label: '06 PAN RIGHT', desc: 'Dynamic pan right' },
];

const CAPTION_OPTIONS: { id: CaptionPreset; label: string }[] = [
  { id: 'hook', label: 'Hook Badge' },
  { id: 'highlight', label: 'Highlight' },
  { id: 'normal', label: 'Normal Clean' },
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
      <div className="alco-card p-6 text-center text-xs text-muted-foreground">
        Pilih scene pada timeline untuk menginspeksi dan menyetel properti scene.
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
    <div className="alco-card p-5 space-y-5">
      {/* Property Inspector Header */}
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-black text-primary-foreground">
            #{sceneIndex + 1}
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Scene Inspector
            </h3>
            <p className="font-mono text-[11px] text-primary">
              {scene.start.toFixed(2)}s - {scene.end.toFixed(2)}s ({(scene.end - scene.start).toFixed(1)}s)
            </p>
          </div>
        </div>

        {/* Compact Quality Pills */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-foreground">
            <Flame className="w-3 h-3 text-rose-500" /> {scores.hook_strength}%
          </span>
          <span className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-foreground">
            <Zap className="w-3 h-3 text-primary" /> {scores.emotional_intensity}/10
          </span>
        </div>
      </div>

      {/* 1. SCENE */}
      <div className="space-y-2">
        <div className="alco-section-label">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Scene Role</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              className={`py-1.5 px-2 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                scene.role === role
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Talking Head Eyeline Status if detected */}
        {scene.talking_head_framing && (
          <div className="flex items-center justify-between rounded border border-border bg-secondary/50 px-2.5 py-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              Eyeline Protection ({scene.talking_head_framing.eyeline_y_percent}%)
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {scene.talking_head_framing.framing_mode.replace('_', ' ')} ({scene.talking_head_framing.smart_reframe_scale}x)
            </span>
          </div>
        )}
      </div>

      {/* 2. CAPTION */}
      <div className="space-y-2.5 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="alco-section-label !mb-0">
            <Type className="w-3.5 h-3.5 text-primary" />
            <span>Caption</span>
          </div>
          {/* Mode switch */}
          <div className="flex items-center gap-1 rounded bg-secondary p-0.5 text-[10px]">
            {(['verbatim', 'punchy', 'summary'] as CaptionMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleCaptionModeChange(mode)}
                className={`px-2 py-0.5 rounded font-bold capitalize cursor-pointer transition-colors ${
                  scene.caption_mode === mode
                    ? 'bg-card text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Caption Text Input */}
        <input
          type="text"
          value={scene.caption}
          onChange={(e) => handleCaptionTextChange(e.target.value)}
          placeholder="Caption text displayed on screen..."
          className="w-full rounded border border-border bg-secondary px-3 py-2 text-xs font-semibold uppercase text-foreground focus:border-primary focus:outline-none"
        />

        {/* Caption Style Preset */}
        <div className="grid grid-cols-3 gap-1.5">
          {CAPTION_OPTIONS.map((cOpt) => (
            <button
              key={cOpt.id}
              type="button"
              onClick={() => handleCaptionStyleChange(cOpt.id)}
              className={`py-1.5 px-2 rounded text-[11px] font-semibold text-center transition-all cursor-pointer ${
                scene.caption_style === cOpt.id
                  ? 'border border-primary bg-primary/10 text-primary font-bold'
                  : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              {cOpt.label}
            </button>
          ))}
        </div>

        {/* Highlight words */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Kata Penekanan (Highlight Words):
          </span>
          <input
            type="text"
            value={(scene.highlight_words || []).join(', ')}
            onChange={(e) => handleHighlightWordsChange(e.target.value)}
            placeholder="PRODUK, CEPAT, SOLUSI (pisahkan koma)"
            className="w-full rounded border border-border bg-secondary px-2.5 py-1.5 text-xs font-semibold text-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* 3. MOTION */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="alco-section-label !mb-0">
            <Move className="w-3.5 h-3.5 text-primary" />
            <span>Motion Camera</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            Scale: {scene.motion_scale?.toFixed(2) || '1.15'}x
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {MOTION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleMotionChange(opt.id)}
              className={`p-2 rounded border text-left transition-all cursor-pointer ${
                scene.motion === opt.id
                  ? 'border-primary bg-primary/10 text-foreground shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              <div className="text-[11px] font-bold leading-tight">{opt.label}</div>
              <div className="text-[9px] text-muted-foreground truncate">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. B-ROLL */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="alco-section-label !mb-0">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>B-Roll Overlay</span>
          </div>
          {scene.broll && (
            <button
              type="button"
              onClick={() => onUpdateScene({ ...scene, broll: null, visual_intent: 'none' })}
              className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Hapus B-roll
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={scene.visual_intent || 'none'}
            onChange={(e) => handleVisualIntentChange(e.target.value as VisualIntent)}
            className="rounded border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
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
            className="flex items-center justify-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-primary" />
            <span>Stock Library</span>
          </button>
        </div>

        {/* Toggleable Stock Catalog Picker */}
        {showStockPicker && (
          <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-sm animate-fade-in">
            <input
              type="text"
              value={stockSearchFilter}
              onChange={(e) => setStockSearchFilter(e.target.value)}
              placeholder="Cari stock b-roll..."
              className="w-full rounded border border-border bg-secondary px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
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
                  className="rounded border border-border p-1 bg-secondary/50 text-left hover:border-primary transition-all cursor-pointer"
                >
                  <img
                    src={item.thumb}
                    alt={item.title}
                    className="w-full aspect-video object-cover rounded"
                  />
                  <span className="block truncate text-[9px] font-bold text-foreground mt-0.5">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. TRANSITION & SOUND */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Sound FX:</span>
            {scene.sound_effect !== 'none' && (
              <button
                type="button"
                onClick={() => playSoundEffect(scene.sound_effect, 0.5)}
                className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                <Play className="w-2.5 h-2.5" /> Test
              </button>
            )}
          </div>
          <select
            value={scene.sound_effect}
            onChange={(e) => handleSoundEffectChange(e.target.value as SoundEffectType)}
            className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="none">None</option>
            <option value="whoosh">Whoosh (Fast Swipe)</option>
            <option value="pop">Pop (Punch Snap)</option>
            <option value="ding">Ding (Success/Proof)</option>
            <option value="camera_shutter">Camera Shutter</option>
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Transition:</span>
          <select
            value={scene.transition}
            onChange={(e) => onUpdateScene({ ...scene, transition: e.target.value as any })}
            className="w-full rounded border border-border bg-secondary px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="cut">Hard Cut</option>
            <option value="flash">Impact Flash</option>
            <option value="whip_pan">Whip Pan</option>
            <option value="zoom_cut">Zoom Cut</option>
          </select>
        </div>
      </div>

      {/* 6. AI RECOMMENDATION */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="alco-section-label">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>AI Recommendation & Fine-tuning</span>
        </div>

        {scene.director_note && (
          <p className="rounded border border-border bg-secondary/50 p-2 text-[11px] italic text-muted-foreground">
            "{scene.director_note}"
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            placeholder="Instruksi AI: Tingkatkan intensitas zoom, persingkat caption..."
            className="flex-1 rounded border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            disabled={isRegenerating}
            onClick={handleRegenClick}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Regenerate Scene</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
