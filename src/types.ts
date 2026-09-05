export type ContentType =
  | 'clean_creator'
  | 'fast_tiktok'
  | 'meta_ads'
  | 'educational'
  | 'storytelling'
  | 'affiliate'
  | 'reels_tiktok'
  | 'education';

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU' | 'META_ADS';

export type ContentRole =
  | 'hook'
  | 'problem'
  | 'curiosity'
  | 'explanation'
  | 'solution'
  | 'proof'
  | 'cta';

export type MotionPreset =
  | 'normal'
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'punch_zoom'
  | 'pan_left'
  | 'pan_right';

export type CaptionPreset = 'normal' | 'highlight' | 'hook';

export type CaptionGrammarType = 'HOOK_HEADLINE' | 'CAPTION_STANDARD' | 'KEYWORD_EMPHASIS';

export type CaptionDisplayMode = 'clean_floating' | 'hook_headline' | 'proof_badge' | 'cta_emphasis';

export type CaptionMode = 'verbatim' | 'punchy' | 'summary';

export type EvidenceType =
  | 'SCREEN_DEMO'
  | 'SCREEN_PROOF'
  | 'SPLIT_COMPARE'
  | 'CALLOUT_POINTER'
  | 'OFFER_CARD'
  | 'CTA_CARD'
  | 'NONE';

export interface UserProofAsset {
  id: string;
  name: string;
  url: string; // Blob URL or http image URL
  type: 'dashboard' | 'product' | 'screenshot' | 'logo' | 'screen_recording' | 'before_after';
  label?: string;
}

export interface VisualEvidenceCard {
  type: EvidenceType;
  title: string;
  metricValue?: string;
  subtitle?: string;
  badgeTag?: string;
  comparisonLabels?: { before: string; after: string };
  calloutPoint?: string;
  userAssetUrl?: string;
  userAssetType?: 'dashboard' | 'product' | 'screenshot' | 'logo' | 'screen_recording' | 'before_after';
  isUserAsset?: boolean;
}

export type VisualIntent =
  | 'proof'
  | 'metaphor'
  | 'process'
  | 'contrast'
  | 'product'
  | 'result'
  | 'urgency'
  | 'none';

export type TransitionType = 'cut' | 'flash' | 'whip_pan' | 'zoom_cut';

export type SoundEffectType = 'none' | 'whoosh' | 'pop' | 'click' | 'ding' | 'chime' | 'impact' | 'camera_shutter';

export type MarketingCategory = 'problem' | 'benefit_result' | 'offer_mechanism' | 'urgency_cta' | 'general';

export interface WordTiming {
  word: string;
  startOffset: number; // relative to scene start
  endOffset: number;   // relative to scene start
  isHighlight: boolean;
  marketingCategory?: MarketingCategory;
}

export interface SceneIntelligenceScore {
  hook_strength: number;      // 1 - 100
  emotional_intensity: number;// 1 - 10
  clarity_score: number;       // 1 - 10
  urgency_score: number;       // 1 - 10
  proof_strength: number;      // 1 - 10
  cta_pressure: number;        // 1 - 10
  curiosity_tension?: number;  // 1 - 10
  problem_agitation?: number;  // 1 - 10
  visual_fatigue_risk: number; // 0 - 100
  pacing_need: 'rapid' | 'moderate' | 'dramatic_pause' | 'punchy';
  marketing_role?: ContentRole;
}

export interface TranscriptSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface ContentAnalysisItem {
  id: number;
  start: number;
  end: number;
  content_role: ContentRole;
  importance: number; // 1 - 10
  emotion: 'warning' | 'curious' | 'urgent' | 'authoritative' | 'excitement' | 'empathy' | 'neutral';
  key_phrase: string;
  reasoning: string;
  scores?: SceneIntelligenceScore;
}

export interface BRollItem {
  query: string;
  title?: string;
  sourceUrl?: string;
  previewUrl?: string;
  mediaType?: 'video' | 'image';
  visual_intent?: VisualIntent;
  overlay_style?: 'full' | 'pip' | 'split';
  opacity?: number;
  startOffset?: number;
  duration?: number;
  badgeTag?: string;
  entryTransition?: 'fade' | 'zoom_in' | 'slide_left';
}

export interface CameraDynamics {
  zoomSpeed: 'instant' | 'linear' | 'ease_in_out';
  intensity: 'subtle' | 'moderate' | 'high' | 'punch';
  focalPoint: 'center' | 'speaker_eyes' | 'lower_third';
}

export interface VisualCorrectionProfile {
  scene_type: 'talking_head' | 'screen_demo' | 'broll_overlay' | 'natural_balanced';
  brightness: number; // e.g., 100 to 106 (%)
  contrast: number;   // e.g., 100 to 110 (%)
  saturate: number;   // e.g., 100 to 106 (%)
  css_filter: string; // e.g. "brightness(1.05) contrast(1.05) saturate(1.03)"
  status: 'FACE_CLARITY_ENHANCED' | 'SCREEN_TEXT_CRISP' | 'CINEMATIC_OVERLAY_ENHANCED' | 'NATURAL_OPTIMIZED';
  text_legibility_boost: boolean;
  note: string;
}

export interface TalkingHeadFraming {
  is_talking_head: boolean;
  confidence: number; // 0.0 to 1.0
  face_center: { x: number; y: number }; // e.g. { x: 50, y: 34 }
  eyeline_y_percent: number; // Upper 1/3 rule (ideal: 33%)
  headroom_percent: number; // Headroom buffer (ideal: 12-15%)
  smart_reframe_scale: number; // Scaled to prevent face cutoffs (1.05x - 1.22x)
  crop_shift_offset: { x: number; y: number }; // Calibrated offset to keep eyes centered
  framing_mode: 'close_up_impact' | 'medium_talking_head' | 'wide_talking_head' | 'broll_overlay' | 'safe_fallback';
  protection_status: 'EYELINE_LOCKED' | 'FACE_SAFEGUARDED' | 'SAFE_FALLBACK';
  note: string;
}

export interface EditingRhythm {
  rhythm_preset:
    | 'SPECIAL_HOOK_0_3S'
    | 'TENSE_PAIN_BUILD'
    | 'STEADY_EXPLANATION'
    | 'PROUD_PROOF'
    | 'CONVERSION_CTA'
    | 'FAST_TIKTOK_HYPER'
    | 'META_ADS_ROAS'
    | 'AFFILIATE_SHOWCASE'
    | 'EDUCATIONAL_AUTHORITY'
    | 'STORYTELLING_CINEMATIC'
    | 'CLEAN_CREATOR_STEADY';
  cut_cadence_ms: number;
  crop_offset: { x: number; y: number };
  pattern_interrupt_type: 'PUNCH_ZOOM_SLAM' | 'CROP_SHIFT' | 'TOP_HEADLINE_FLASH' | 'PROOF_OVERLAY_CARD' | 'CTA_PULSE' | 'NONE';
  hook_stage_dynamic?: {
    stage1DurationSec: number;
    stage1Scale: number;
    stage1CropOffset: { x: number; y: number };
    stage2Scale: number;
    stage2CropOffset: { x: number; y: number };
  };
  description: string;
}

export interface SceneEditPlan {
  id: number;
  start: number;
  end: number;
  role: ContentRole;
  motion: MotionPreset;
  motion_scale: number; // e.g. 1.0, 1.08, 1.18, 1.25
  caption: string;
  caption_style: CaptionPreset;
  caption_grammar: CaptionGrammarType;
  caption_mode: CaptionMode;
  caption_display_mode?: CaptionDisplayMode;
  highlight_words: string[];
  word_timings?: WordTiming[];
  broll: BRollItem | null;
  visual_evidence?: VisualEvidenceCard | null;
  visual_intent: VisualIntent;
  transition: TransitionType;
  sound_effect: SoundEffectType;
  director_note?: string;
  scores: SceneIntelligenceScore;
  camera_dynamics: CameraDynamics;
  editing_rhythm?: EditingRhythm;
  talking_head_framing?: TalkingHeadFraming;
  visual_correction?: VisualCorrectionProfile;
}

export interface StylePresetProfile {
  id: ContentType;
  name: string;
  tagline: string;
  funnelStage: FunnelStage;
  pacingSummary: string;
  motionGrammar: string;
  brollDensity: 'selective' | 'high' | 'strategic';
  captionStyle: string;
  hookRule: string;
  badgeColor: string;
}

export interface CreativeRecommendation {
  id: string;
  sceneId?: number;
  category: 'hook' | 'readability' | 'proof' | 'cta' | 'fatigue' | 'safe_zone';
  severity: 'high' | 'medium' | 'low' | 'passed';
  title: string;
  description: string;
  actionableFix: string;
}

export interface CreativeAuditResult {
  overallScore: number;
  grade: 'S' | 'A+' | 'A' | 'B' | 'C';
  categoryScores: {
    hookStrength: number;
    captionReadability: number;
    proofPresence: number;
    ctaClarity: number;
    fatigueRiskControl: number;
    safeZoneCompliance: number;
  };
  recommendations: CreativeRecommendation[];
}

export interface PacingProfile {
  avg_scene_duration: number;
  pattern_interrupt_count: number;
  retention_risk_points: number[];
  pacing_grade: 'S' | 'A+' | 'A' | 'B';
  overall_rhythm_description: string;
  hook_retention_index: number;
}

export interface AlcoEditingProject {
  video_type: ContentType;
  funnel_stage: FunnelStage;
  title: string;
  target_goal?: string;
  cta_text?: string;
  total_duration: number;
  raw_video_url?: string;
  transcript: TranscriptSegment[];
  analysis: ContentAnalysisItem[];
  scenes: SceneEditPlan[];
  user_proof_assets?: UserProofAsset[];
  pacing_profile?: PacingProfile;
  creative_audit?: CreativeAuditResult;
  talking_head_summary?: {
    dominant: boolean;
    confidence: number;
    ratio_percent: number;
    primary_framing_mode: string;
    eyeline_lock_active: boolean;
  };
  visual_quality_summary?: {
    overall_grade: 'OPTIMAL' | 'ENHANCED_FACE_CLARITY' | 'SCREEN_TEXT_OPTIMIZED';
    face_clarity_boost_applied: boolean;
    screen_text_crisp_applied: boolean;
    lighting_note: string;
  };
  stats?: {
    hook_strength: number; // 1-100
    pacing_score: number;  // 1-100
    visual_variety: number; // 1-100
    retention_estimate: string;
  };
  output_audit?: OutputQualityAuditResult;
}

export interface RenderFrameTelemetry {
  sampledFramesCount: number;
  scalesHistory: number[];
  videoCoverageRatios: number[];
  sceneChangesDetected: number;
  captionYPositions: number[];
  faceOcclusionViolations: number;
  sfxTriggeredCount: number;
  durationRendered: number;
  actualDurationSeconds?: number;
  fileSizeBytes?: number;
  frameDropRatio?: number;
  playbackHealthy?: boolean;
  targetFrameCount?: number;
  actualRenderedFrames?: number;
  duplicateFrameRisk?: number;
  averageFrameRenderMs?: number;
  maxFrameRenderMs?: number;
  droppedFrameCount?: number;
  effectiveFps?: number;
  encodedFrameCount?: number;
  effectiveEncodedFps?: number;
  maxEncodedFrameGapMs?: number;
  hasValidMetadataFps?: boolean;
  encodedWidth?: number;
  encodedHeight?: number;
}

export interface OutputQualityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  details: string;
  impact: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface OutputQualityAuditResult {
  passed: boolean;
  status: 'CERTIFIED_READY' | 'VALIDATION_FAILED';
  qualityScore: number; // 0 - 100
  metrics: {
    mainVideoCoveragePercent: number; // e.g. 98%
    motionDynamicsScore: number;     // e.g. 94%
    sceneVarietyScore: number;       // e.g. 92%
    captionSafeZoneScore: number;    // e.g. 100%
    editCadenceScore: number;        // e.g. 95%
    playbackHealthScore?: number;    // e.g. 98%
    encodedFps?: number;
    encodedFrames?: number;
    targetFrames?: number;
    maxFrameGapMs?: number;
  };
  checks: OutputQualityCheckItem[];
  failureReasons: string[];
  suggestedFixes: string[];
  isPosterLike: boolean;
  isTooStatic: boolean;
  isMainVideoTooSmall: boolean;
  isCaptionOccluding: boolean;
  isPlaybackCorrupt?: boolean;
}

export interface SampleVideoOption {
  id: string;
  title: string;
  duration: number;
  contentType: ContentType;
  description: string;
  videoUrl: string;
  thumbnail: string;
  rawTranscript: string;
  goal: string;
  cta: string;
  prebuiltSegments: TranscriptSegment[];
  defaultUserAssets?: UserProofAsset[];
}

export type ProcessingStepId =
  | 'init'
  | 'segmentation'
  | 'content_analysis'
  | 'edit_plan'
  | 'finalizing';

export interface ProcessingStepInfo {
  id: ProcessingStepId;
  title: string;
  subtitle: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number; // 0 - 100
  durationMs?: number;
  details?: string;
  badge?: string;
}

export interface ProcessingLogEntry {
  id: string;
  timestamp: number;
  relativeTime: string;
  stepId: ProcessingStepId;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'metric';
}

export interface ProcessingState {
  isProcessing: boolean;
  currentStepId: ProcessingStepId;
  overallProgress: number; // 0 - 100
  startTime: number | null;
  elapsedMs: number;
  estimatedRemainingMs: number;
  steps: ProcessingStepInfo[];
  logs: ProcessingLogEntry[];
  error: string | null;
  failedStepId?: ProcessingStepId;
}

