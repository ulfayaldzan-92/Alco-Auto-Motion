import {
  AlcoEditingProject,
  ContentAnalysisItem,
  ContentType,
  SceneEditPlan,
  TranscriptSegment,
  CaptionMode,
  CaptionPreset,
  ContentRole,
  StylePresetProfile,
  UserProofAsset,
} from '../types';
import { calculateSceneIntelligence, calculateOverallPacingProfile } from './scoringEngine';
import { decideSceneMotion } from './motionDirector';
import { calculateEditingRhythm } from './rhythmEngine';
import { formatCaptionByMode, extractPowerHighlightWords, generateWordTimings, determineCaptionDisplayMode } from './captionEngine';
import { determineBrollDecision } from './brollDirector';
import { mapContentTypeToFunnelStage, selectCaptionGrammar } from './funnelEngine';
import { generateVisualEvidence } from './evidenceEngine';
import { validateCreativePerformance } from './creativeValidator';
import { STYLE_PRESET_PROFILES, getStyleProfile } from './styleProfiles';
import { analyzeTalkingHeadScene, analyzeProjectTalkingHeadDominance } from './talkingHeadDirector';
import { analyzeSceneVisualCorrection, summarizeProjectVisualQuality } from './lightingDirector';

export * from './scoringEngine';
export * from './captionEngine';
export * from './motionDirector';
export * from './rhythmEngine';
export * from './brollDirector';
export * from './stockCatalog';
export * from './funnelEngine';
export * from './evidenceEngine';
export * from './creativeValidator';
export * from './styleProfiles';
export * from './talkingHeadDirector';
export * from './lightingDirector';
export * from './outputQualityAuditor';

export const STYLE_PROFILES: Record<ContentType, StylePresetProfile> = {
  clean_creator: {
    id: 'clean_creator',
    name: 'Clean Creator',
    tagline: 'Authentic Talking-Head & Clean Aesthetic',
    funnelStage: 'TOFU',
    pacingSummary: 'Balanced 3.5s - 5s rhythm with natural breathing room',
    motionGrammar: 'Subtle push-in (1.08x - 1.12x), zero jarring cuts, smooth transitions',
    brollDensity: 'selective',
    captionStyle: 'Clean Frosted Pill, high-contrast readable typography',
    hookRule: 'Direct human eye contact, subtle 1.15x push, no audio distraction',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  fast_tiktok: {
    id: 'fast_tiktok',
    name: 'Fast TikTok / Reels',
    tagline: 'Aggressive Pattern Interrupts & Maximum Retention',
    funnelStage: 'TOFU',
    pacingSummary: 'Hyper-fast 1.8s - 3.2s rapid-fire scene cuts',
    motionGrammar: '1.25x Punch Zooms, Flash Cuts, Whip Pans & Whoosh SFX every 2-3s',
    brollDensity: 'high',
    captionStyle: 'Dynamic Karaoke Badge with active glowing word highlight',
    hookRule: '1.25x punch zoom + flash transition + whoosh sound in 0-2s window',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  meta_ads: {
    id: 'meta_ads',
    name: 'Meta Ads (Direct Response)',
    tagline: 'Conversion-Optimized Hook-Problem-Proof-CTA Funnel',
    funnelStage: 'META_ADS',
    pacingSummary: 'Strategic 2.5s - 4.0s rhythm tailored to customer decision stages',
    motionGrammar: 'Pain zoom-in (1.10x), Solution zoom-out (1.0x relief), Proof pan with Ding SFX',
    brollDensity: 'strategic',
    captionStyle: 'High-Impact Hook Box & Green/Amber/Cyan conversion tokens',
    hookRule: 'Pain callout + instant zoom + speaker eye lock for 3s retention spike',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  educational: {
    id: 'educational',
    name: 'Educational / Authority',
    tagline: 'Framework Breakdown, Step-by-Step & Clear Concept Proof',
    funnelStage: 'MOFU',
    pacingSummary: 'Informative 3.5s - 5.0s pacing giving viewers time to absorb insights',
    motionGrammar: 'Steady lateral pans, split-screen contrast, diagram callouts',
    brollDensity: 'strategic',
    captionStyle: 'Structured Takeaway Badges & keyword emphasis',
    hookRule: 'Contrarian question or secret reveal with steady eye contact',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  storytelling: {
    id: 'storytelling',
    name: 'Storytelling / Cinematic',
    tagline: 'Emotional Arc, Problem Agitation & Transformation Reveal',
    funnelStage: 'MOFU',
    pacingSummary: 'Dynamic pacing that slows down on pain and accelerates on triumph',
    motionGrammar: 'Dramatic slow zooms (1.14x), cinematic full-frame metaphor B-rolls',
    brollDensity: 'high',
    captionStyle: 'Subtle cinematic bottom third with yellow highlight accents',
    hookRule: 'Open curiosity loop and vulnerability anchor',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  affiliate: {
    id: 'affiliate',
    name: 'Affiliate / Product Showcase',
    tagline: 'Demonstration, Problem-Solution Contrast & Keranjang Kuning Tap',
    funnelStage: 'BOFU',
    pacingSummary: 'Snappy 2.2s - 3.5s demo-driven rhythm',
    motionGrammar: 'Punch zoom on product feature, PIP live in-use demo, Ding on discount',
    brollDensity: 'high',
    captionStyle: 'High-energy hook box with cyan/amber product tags',
    hookRule: 'Direct pain visual or immediate product transformation hook',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  reels_tiktok: {
    id: 'reels_tiktok',
    name: 'Fast TikTok / Reels',
    tagline: 'Aggressive Pattern Interrupts & Maximum Retention',
    funnelStage: 'TOFU',
    pacingSummary: 'Hyper-fast 1.8s - 3.2s rapid-fire scene cuts',
    motionGrammar: '1.25x Punch Zooms, Flash Cuts, Whip Pans & Whoosh SFX every 2-3s',
    brollDensity: 'high',
    captionStyle: 'Dynamic Karaoke Badge with active glowing word highlight',
    hookRule: '1.25x punch zoom + flash transition + whoosh sound in 0-2s window',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  education: {
    id: 'education',
    name: 'Educational / Authority',
    tagline: 'Framework Breakdown, Step-by-Step & Clear Concept Proof',
    funnelStage: 'MOFU',
    pacingSummary: 'Informative 3.5s - 5.0s pacing giving viewers time to absorb insights',
    motionGrammar: 'Steady lateral pans, split-screen contrast, diagram callouts',
    brollDensity: 'strategic',
    captionStyle: 'Structured Takeaway Badges & keyword emphasis',
    hookRule: 'Contrarian question or secret reveal with steady eye contact',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  }
};

/**
 * Master AI Creative Performance Engine Orchestrator
 * Transforms transcript segments and 6-stage marketing framework into an elite edit plan
 */
export function buildIntelligentEditPlan(
  segments: TranscriptSegment[],
  analysis: ContentAnalysisItem[],
  contentType: ContentType = 'meta_ads',
  goal: string = '',
  cta: string = '',
  totalDuration?: number,
  captionMode: CaptionMode = 'verbatim',
  userAssets?: UserProofAsset[]
): AlcoEditingProject {
  const duration = totalDuration || (segments.length > 0 ? segments[segments.length - 1].end : 25);
  const funnelStage = mapContentTypeToFunnelStage(contentType);
  const scenes: SceneEditPlan[] = [];

  let previousMotion: any = undefined;
  let previousFatigue = 20;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const ana: any = analysis[i] || {};
    const segDur = Math.max(0.5, seg.end - seg.start);

    // Determine Role using 6-stage marketing framework
    let role: ContentRole = (ana?.content_role as ContentRole) || (
      i === 0 ? 'hook' :
      i === 1 ? 'problem' :
      i === 2 ? 'curiosity' :
      i === segments.length - 2 ? 'proof' :
      i === segments.length - 1 ? 'cta' :
      'solution'
    );

    // 1. Calculate Multi-Factor Intelligence Scores
    const scores = calculateSceneIntelligence(
      seg,
      role,
      contentType,
      i,
      segments.length,
      { duration: segDur, motion: previousMotion, fatigue: previousFatigue }
    );
    previousFatigue = scores.visual_fatigue_risk;

    // 2. Decide Context-Aware Motion & Camera Dynamics
    const nextRole = analysis[i + 1]?.content_role;
    const motionResult = decideSceneMotion(
      role,
      scores,
      i,
      segments.length,
      contentType,
      previousMotion,
      nextRole,
      seg.text
    );
    previousMotion = motionResult.motion;

    // 3. Caption Grammar, Formatting & Smart Highlight Selection
    const captionGrammar = selectCaptionGrammar(role, funnelStage, i);
    const captionText = formatCaptionByMode(seg.text, captionMode, role);
    const highlightWords = extractPowerHighlightWords(captionText, role === 'hook' ? 3 : 2);
    const wordTimings = generateWordTimings(captionText, segDur, highlightWords, role);

    let captionStyle: CaptionPreset = 'highlight';
    if (role === 'hook' || scores.hook_strength >= 85) {
      captionStyle = 'hook';
    } else if (role === 'cta') {
      captionStyle = 'hook';
    } else if (scores.emotional_intensity < 6) {
      captionStyle = 'normal';
    }

    // 4. B-Roll & Visual Intent Decisioning (Prioritizing User Proof Assets)
    const brollDecision = determineBrollDecision(
      role,
      seg.text,
      scores,
      i,
      segments.length,
      contentType,
      userAssets
    );

    // 5. Visual Evidence Engine Card Generation (Prioritizing User Proof Assets)
    const visualEvidence = generateVisualEvidence(role, seg.text, funnelStage, scores.proof_strength, userAssets);

    // 6. Calculate Editing Rhythm & Pattern Interrupt Cadence
    const editingRhythm = calculateEditingRhythm(role, scores, i, segments.length, contentType, segDur);

    // 7. Calculate Talking Head Intelligence & Eyeline Safeguards
    const talkingHeadFraming = analyzeTalkingHeadScene(
      role,
      seg.text,
      contentType,
      scores,
      i,
      brollDecision.broll,
      visualEvidence
    );

    // 8. Calculate Lighting & Visual Quality Correction
    const visualCorrection = analyzeSceneVisualCorrection(
      role,
      contentType,
      talkingHeadFraming,
      brollDecision.broll,
      visualEvidence
    );

    // 9. Calculate Caption Display Mode
    const captionDisplayMode = determineCaptionDisplayMode(role, captionGrammar, visualEvidence?.type);

    // Combine director notes
    const combinedDirectorNote = [motionResult.directorNote, brollDecision.directorNote, editingRhythm.description, talkingHeadFraming.note, visualCorrection.note]
      .filter(Boolean)
      .join(' ');

    scenes.push({
      id: seg.id || i + 1,
      start: seg.start,
      end: seg.end,
      role,
      motion: motionResult.motion,
      motion_scale: talkingHeadFraming.is_talking_head ? talkingHeadFraming.smart_reframe_scale : motionResult.motion_scale,
      caption: captionText,
      caption_style: captionStyle,
      caption_grammar: captionGrammar,
      caption_mode: captionMode,
      caption_display_mode: captionDisplayMode,
      highlight_words: highlightWords,
      word_timings: wordTimings,
      broll: brollDecision.broll,
      visual_evidence: visualEvidence,
      visual_intent: brollDecision.intent,
      transition: motionResult.transition,
      sound_effect: motionResult.sound_effect,
      director_note: combinedDirectorNote,
      scores,
      camera_dynamics: {
        ...motionResult.camera_dynamics,
        focalPoint: talkingHeadFraming.is_talking_head ? 'speaker_eyes' : motionResult.camera_dynamics.focalPoint,
      },
      editing_rhythm: editingRhythm,
      talking_head_framing: talkingHeadFraming,
      visual_correction: visualCorrection,
    });
  }

  // Calculate project pacing profile, talking head dominance, lighting summary & retention metrics
  const pacingProfile = calculateOverallPacingProfile(scenes);
  const talkingHeadSummary = analyzeProjectTalkingHeadDominance(scenes.map(s => s.talking_head_framing!).filter(Boolean));
  const visualQualitySummary = summarizeProjectVisualQuality(scenes.map(s => s.visual_correction!).filter(Boolean));
  const styleProfile = STYLE_PROFILES[contentType] || STYLE_PROFILES['meta_ads'];

  // Build partial project for validation
  const partialProject: AlcoEditingProject = {
    video_type: contentType,
    funnel_stage: funnelStage,
    title: `Alco Creative Performance Plan (${styleProfile.name})`,
    target_goal: goal || 'High Retention & Direct Response Marketing',
    cta_text: cta,
    total_duration: duration,
    transcript: segments,
    analysis,
    scenes,
    user_proof_assets: userAssets,
    pacing_profile: pacingProfile,
    talking_head_summary: talkingHeadSummary,
    visual_quality_summary: visualQualitySummary,
    stats: {
      hook_strength: Math.min(100, Math.max(85, scenes[0]?.scores?.hook_strength || 94)),
      pacing_score: pacingProfile.pacing_grade === 'S' ? 98 : pacingProfile.pacing_grade === 'A+' ? 92 : 86,
      visual_variety: Math.min(98, 78 + pacingProfile.pattern_interrupt_count * 4),
      retention_estimate: `${pacingProfile.hook_retention_index}% projected 3s hook retention`,
    },
  };

  // 6. Run Creative Validation Layer (Prioritas 4)
  const auditResult = validateCreativePerformance(partialProject);
  partialProject.creative_audit = auditResult;

  return partialProject;
}

