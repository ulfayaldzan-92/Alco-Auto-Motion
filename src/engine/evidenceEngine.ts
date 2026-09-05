import { ContentRole, EvidenceType, VisualEvidenceCard, FunnelStage, UserProofAsset } from '../types';

/**
 * Visual Evidence Engine
 * Generates high-impact visual proof & evidence cards for MOFU, BOFU, and Meta Ads direct response videos.
 * Prioritizes user-uploaded authentic screenshots, dashboards, product photos, and before-after assets.
 */
export function generateVisualEvidence(
  role: ContentRole,
  text: string,
  funnelStage: FunnelStage,
  proofStrength: number,
  userAssets?: UserProofAsset[]
): VisualEvidenceCard | null {
  const textUpper = text.toUpperCase();

  // Helper to find relevant user asset by type priority
  const findUserAsset = (types: UserProofAsset['type'][]) => {
    if (!userAssets || userAssets.length === 0) return null;
    return userAssets.find((a) => types.includes(a.type)) || null;
  };

  // 1. SCREEN_PROOF: Real analytics, revenue, ROAS, CTR metrics
  if (
    role === 'proof' ||
    proofStrength >= 7 ||
    /ROAS|CTR|OMSET|PROFIT|5X|10X|90%|JUTA|RIBU|HASIL|BUKTI|TEMBUS|CONVERSION|METRIC|DATA/i.test(textUpper)
  ) {
    const userProof = findUserAsset(['dashboard', 'screenshot']);
    let metricVal = '5.4x ROAS';
    if (textUpper.includes('10X')) metricVal = '10.2x ROAS';
    else if (textUpper.includes('OMSET')) metricVal = 'Rp 142.000.000+';
    else if (textUpper.includes('90%')) metricVal = '94.2% Conv. Rate';

    return {
      type: 'SCREEN_PROOF',
      title: userProof?.label || 'VERIFIED DASHBOARD ANALYTICS',
      metricValue: metricVal,
      subtitle: userProof ? `Authentic Evidence: ${userProof.name}` : 'Real-time performance tracking & validated ROAS',
      badgeTag: userProof ? 'VERIFIED USER ASSET' : 'LIVE DATA PROOF',
      userAssetUrl: userProof?.url,
      userAssetType: userProof?.type,
      isUserAsset: Boolean(userProof),
    };
  }

  // 2. SPLIT_COMPARE: Before vs After / Old method vs New Framework
  if (
    role === 'curiosity' ||
    textUpper.includes('BEFORE AFTER') ||
    textUpper.includes('DULU') ||
    textUpper.includes('SEKARANG') ||
    textUpper.includes('CARA LAMA') ||
    textUpper.includes('BEDANYA')
  ) {
    const userCompare = findUserAsset(['before_after', 'screenshot']);
    return {
      type: 'SPLIT_COMPARE',
      title: userCompare?.label || 'METHODOLOGY COMPARISON',
      subtitle: userCompare ? `Evidence Comparison: ${userCompare.name}` : 'Old Manual Wasted Spend vs AI Auto Motion Workflow',
      comparisonLabels: {
        before: '❌ Old Way: High Friction & Slow Edits',
        after: '⚡ Alco Engine: 5x Higher Conversion',
      },
      badgeTag: userCompare ? 'AUTHENTIC COMPARISON' : 'SYSTEM COMPARISON',
      userAssetUrl: userCompare?.url,
      userAssetType: userCompare?.type,
      isUserAsset: Boolean(userCompare),
    };
  }

  // 3. SCREEN_DEMO: Product demo or software workflow
  if (
    role === 'solution' ||
    textUpper.includes('SOLUSI') ||
    textUpper.includes('DEMO') ||
    textUpper.includes('RISET') ||
    textUpper.includes('WORKFLOW') ||
    textUpper.includes('TEMPLATE') ||
    textUpper.includes('SYSTEM')
  ) {
    const userDemo = findUserAsset(['product', 'screen_recording', 'dashboard']);
    return {
      type: 'SCREEN_DEMO',
      title: userDemo?.label || 'SOLUTION MECHANISM DEMO',
      subtitle: userDemo ? `Live Product Showcase: ${userDemo.name}` : 'Step-by-step auto segmentation & motion zoom engine',
      calloutPoint: userDemo ? `🎯 Verified Solution: ${userDemo.name}` : '🎯 Auto 6-Stage Marketing Blueprint',
      badgeTag: userDemo ? 'PRODUCT DEMO ASSET' : 'LIVE FEATURE DEMO',
      userAssetUrl: userDemo?.url,
      userAssetType: userDemo?.type,
      isUserAsset: Boolean(userDemo),
    };
  }

  // 4. CALLOUT_POINTER: Problem agitation or specific warning point
  if (
    role === 'problem' ||
    textUpper.includes('SALAH') ||
    textUpper.includes('FATAL') ||
    textUpper.includes('BAKAR') ||
    textUpper.includes('BONCOS')
  ) {
    const userProblemAsset = findUserAsset(['screenshot', 'dashboard']);
    return {
      type: 'CALLOUT_POINTER',
      title: 'CRITICAL AUDIT CALLOUT',
      subtitle: 'High drop-off rate detected in first 3 seconds',
      calloutPoint: '⚠️ 82% Viewers Leave Without Hook Zoom',
      badgeTag: 'PAIN POINT AUDIT',
      userAssetUrl: userProblemAsset?.url,
      userAssetType: userProblemAsset?.type,
      isUserAsset: Boolean(userProblemAsset),
    };
  }

  // 5. OFFER_CARD / CTA_CARD for BOFU & Meta Ads CTA
  if (role === 'cta') {
    const userLogoOrProduct = findUserAsset(['logo', 'product', 'screenshot']);

    if (textUpper.includes('DISKON') || textUpper.includes('GRATIS') || textUpper.includes('OFFER') || textUpper.includes('LIMITED')) {
      return {
        type: 'OFFER_CARD',
        title: userLogoOrProduct?.label || 'SPECIAL LIMITED CREATIVE OFFER',
        metricValue: 'SAVE 40% TODAY',
        subtitle: 'Instant Access to Alco AI Creative Performance Engine',
        badgeTag: userLogoOrProduct ? 'VERIFIED OFFER' : 'EXCLUSIVE OFFER',
        userAssetUrl: userLogoOrProduct?.url,
        userAssetType: userLogoOrProduct?.type,
        isUserAsset: Boolean(userLogoOrProduct),
      };
    }

    return {
      type: 'CTA_CARD',
      title: userLogoOrProduct?.label || 'CLICK LINK IN BIO TO ACCESS ENGINE',
      subtitle: 'Transform your short-form video conversion now',
      calloutPoint: '👉 TAP LINK BELOW',
      badgeTag: userLogoOrProduct ? 'BRAND ACTION TRIGGER' : 'CONVERSION TRIGGER',
      userAssetUrl: userLogoOrProduct?.url,
      userAssetType: userLogoOrProduct?.type,
      isUserAsset: Boolean(userLogoOrProduct),
    };
  }

  // For Meta Ads / BOFU fallback demo card
  if (funnelStage === 'META_ADS' || funnelStage === 'BOFU') {
    const fallbackAsset = findUserAsset(['dashboard', 'product', 'screenshot']);
    return {
      type: 'SCREEN_DEMO',
      title: fallbackAsset?.label || 'AI CREATIVE PERFORMANCE ENGINE',
      subtitle: 'Automated high-converting vertical video workflow',
      badgeTag: fallbackAsset ? 'VERIFIED PROOF ASSET' : 'CORE SYSTEM',
      userAssetUrl: fallbackAsset?.url,
      userAssetType: fallbackAsset?.type,
      isUserAsset: Boolean(fallbackAsset),
    };
  }

  return null;
}
