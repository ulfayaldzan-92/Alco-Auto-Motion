import { ContentRole, ContentType, VisualIntent, BRollItem, SceneIntelligenceScore, UserProofAsset } from '../types';
import { EXTENDED_STOCK_CATALOG, StockCatalogItem } from './stockCatalog';

/**
  * AI Creative Performance B-Roll Director
  * Determines visual intent, timing offsets, framing, and semantic search queries
  * based on the 6-stage marketing framework: HOOK -> PROBLEM -> CURIOSITY -> SOLUTION -> PROOF -> CTA
  * Prioritizes user-uploaded authentic screenshots/dashboards/products over generic B-roll.
  */
export function determineBrollDecision(
  role: ContentRole,
  text: string,
  scores: SceneIntelligenceScore,
  index: number,
  totalScenes: number,
  contentType: ContentType,
  userAssets?: UserProofAsset[]
): {
  intent: VisualIntent;
  broll: BRollItem | null;
  directorNote: string;
} {
  const textUpper = text.toUpperCase();

  // Helper to find matching user asset
  const findUserAsset = (types: UserProofAsset['type'][]) => {
    if (!userAssets || userAssets.length === 0) return null;
    return userAssets.find((a) => types.includes(a.type)) || null;
  };

  // Normalize style identifier
  const style = (contentType || 'meta_ads') as string;
  const isFastTikTok = style === 'fast_tiktok' || style === 'reels_tiktok';
  const isCleanCreator = style === 'clean_creator';
  const isMetaAds = style === 'meta_ads';
  const isAffiliate = style === 'affiliate';
  const isEducational = style === 'educational' || style === 'education';
  const isStorytelling = style === 'storytelling';

  // =========================================================================
  // STAGE 1: HOOK (0-3s Window)
  // Human connection is paramount in 0-3s. Never cover the speaker's face full-screen!
  // =========================================================================
  if (index === 0 || role === 'hook') {
    // In Fast TikTok style or Meta Ads with specific pain words, allow a micro PIP badge, otherwise 100% face
    if ((isFastTikTok || isMetaAds) && (textUpper.includes('JANGAN') || textUpper.includes('STOP') || textUpper.includes('BAKAR UANG'))) {
      const match = EXTENDED_STOCK_CATALOG.find((c) => c.id === 'metaphor-burning-money') || EXTENDED_STOCK_CATALOG[3];
      return {
        intent: 'metaphor',
        broll: {
          query: 'Ad budget burning & wasted spend alert',
          title: match.title,
          sourceUrl: match.url,
          previewUrl: match.thumb,
          mediaType: match.type,
          visual_intent: 'metaphor',
          overlay_style: 'pip',
          opacity: 0.92,
          startOffset: 0.8,
          duration: 1.8,
          badgeTag: match.badgeTag,
          entryTransition: 'zoom_in',
        },
        directorNote: '0-3s Hook Strategy: Speaker eye-contact maintained with micro PIP visual alarm popping at 0.8s for maximum pattern-interrupt.',
      };
    }

    return {
      intent: 'none',
      broll: null,
      directorNote: '0-3s Hook Rule: 100% direct speaker eye-contact to establish immediate human rapport and trust before introducing B-roll.',
    };
  }

  // =========================================================================
  // STAGE 2: PROBLEM / PAIN AGITATION
  // Metaphor visual or contrast visual anchors the frustration
  // =========================================================================
  if (role === 'problem' || textUpper.includes('SALAH') || textUpper.includes('BAKAR UANG') || textUpper.includes('RUGI') || textUpper.includes('BONCOS')) {
    const userProblemAsset = findUserAsset(['screenshot', 'dashboard']);
    if (userProblemAsset) {
      return {
        intent: 'metaphor',
        broll: {
          query: userProblemAsset.label || userProblemAsset.name,
          title: userProblemAsset.name,
          sourceUrl: userProblemAsset.url,
          previewUrl: userProblemAsset.url,
          mediaType: 'image',
          visual_intent: 'metaphor',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.3,
          duration: 2.5,
          badgeTag: 'USER PROBLEM EVIDENCE',
          entryTransition: 'fade',
        },
        directorNote: `Authentic User Asset Attached: Using uploaded ${userProblemAsset.name} as problem agitation overlay.`,
      };
    }

    const isMoneyIssue = textUpper.includes('BAKAR UANG') || textUpper.includes('BUDGET') || textUpper.includes('RUGI') || textUpper.includes('BONCOS');
    const match = isMoneyIssue
      ? EXTENDED_STOCK_CATALOG.find((c) => c.id === 'metaphor-burning-money') || EXTENDED_STOCK_CATALOG[3]
      : EXTENDED_STOCK_CATALOG.find((c) => c.id === 'metaphor-frustration-burnout') || EXTENDED_STOCK_CATALOG[2];

    const framing = isStorytelling ? 'full' : isCleanCreator ? 'pip' : 'pip';

    return {
      intent: 'metaphor',
      broll: {
        query: isMoneyIssue ? 'Wasted marketing budget drain visual' : 'Creator frustrated facing insurmountable obstacle',
        title: match.title,
        sourceUrl: match.url,
        previewUrl: match.thumb,
        mediaType: match.type,
        visual_intent: 'metaphor',
        overlay_style: framing,
        opacity: 0.95,
        startOffset: 0.3,
        duration: 2.5,
        badgeTag: match.badgeTag,
        entryTransition: 'fade',
      },
      directorNote: 'Problem Agitation: Metaphor visual anchors viewer pain point, triggering deep emotional agreement before revealing the solution.',
    };
  }

  // =========================================================================
  // STAGE 3: CURIOSITY / CONTRAST
  // Open loops & paradigm shift (Dulu vs Sekarang / Cara Lama vs Baru)
  // =========================================================================
  if (role === 'curiosity' || textUpper.includes('TERNYATA') || textUpper.includes('KUNCINYA') || textUpper.includes('BUKAN') || textUpper.includes('BEFORE AFTER')) {
    const userCompare = findUserAsset(['before_after', 'screenshot']);
    if (userCompare) {
      return {
        intent: 'contrast',
        broll: {
          query: userCompare.label || userCompare.name,
          title: userCompare.name,
          sourceUrl: userCompare.url,
          previewUrl: userCompare.url,
          mediaType: 'image',
          visual_intent: 'contrast',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.2,
          duration: 2.8,
          badgeTag: 'USER COMPARE ASSET',
          entryTransition: 'slide_left',
        },
        directorNote: `Authentic User Asset Attached: Using uploaded ${userCompare.name} for curiosity comparison.`,
      };
    }

    const match = EXTENDED_STOCK_CATALOG.find((c) => c.id === 'contrast-before-after') || EXTENDED_STOCK_CATALOG[9];
    return {
      intent: 'contrast',
      broll: {
        query: 'Old inefficient method vs new high-leverage mechanism',
        title: match.title,
        sourceUrl: match.url,
        previewUrl: match.thumb,
        mediaType: match.type,
        visual_intent: 'contrast',
        overlay_style: 'split',
        opacity: 0.95,
        startOffset: 0.2,
        duration: 2.8,
        badgeTag: match.badgeTag,
        entryTransition: 'slide_left',
      },
      directorNote: 'Curiosity & Contrast: Split comparison breaks conventional assumptions and builds anticipation for the core framework.',
    };
  }

  // =========================================================================
  // STAGE 4: PROOF / METRICS / VALIDATION
  // Unassailable evidence (ROAS, CTR, Omset, Graphs, Testimonials)
  // =========================================================================
  if (role === 'proof' || scores.proof_strength >= 7 || /ROAS|CTR|OMSET|DATA|BUKTI|HASIL|%|X|GRAFIK|TEMBUS/i.test(textUpper)) {
    const userProofAsset = findUserAsset(['dashboard', 'screenshot']);
    if (userProofAsset) {
      return {
        intent: 'proof',
        broll: {
          query: userProofAsset.label || userProofAsset.name,
          title: userProofAsset.name,
          sourceUrl: userProofAsset.url,
          previewUrl: userProofAsset.url,
          mediaType: 'image',
          visual_intent: 'proof',
          overlay_style: 'pip',
          opacity: 0.98,
          startOffset: 0.0,
          duration: 3.2,
          badgeTag: 'REAL DASHBOARD PROOF',
          entryTransition: 'zoom_in',
        },
        directorNote: `Priority 1 User Evidence: Attached authentic screenshot/dashboard (${userProofAsset.name}) to proof scene.`,
      };
    }

    const isSalesGrowth = /ROAS|CTR|OMSET|5X|10X|%|GRAFIK/i.test(textUpper);
    const match = isSalesGrowth
      ? EXTENDED_STOCK_CATALOG.find((c) => c.id === 'proof-analytics-dashboard') || EXTENDED_STOCK_CATALOG[0]
      : EXTENDED_STOCK_CATALOG.find((c) => c.id === 'proof-revenue-metrics') || EXTENDED_STOCK_CATALOG[1];

    const framing: 'pip' | 'split' = 'pip';

    return {
      intent: 'proof',
      broll: {
        query: 'Real-time sales dashboard & ROAS metric validation',
        title: match.title,
        sourceUrl: match.url,
        previewUrl: match.thumb,
        mediaType: match.type,
        visual_intent: 'proof',
        overlay_style: framing,
        opacity: 0.95,
        startOffset: 0.2,
        duration: 2.8,
        badgeTag: match.badgeTag,
        entryTransition: 'zoom_in',
      },
      directorNote: 'Proof & Credibility: Floating picture-in-picture proof card maintains speaker prominence while showing concrete metric validation.',
    };
  }

  // =========================================================================
  // STAGE 5: SOLUTION / PROCESS / PRODUCT
  // Demonstrating the actionable mechanism or product preview
  // =========================================================================
  if (role === 'solution' || textUpper.includes('SOLUSI') || textUpper.includes('MODUL') || textUpper.includes('TEMPLATE') || textUpper.includes('PRODUK') || textUpper.includes('VALIDASI')) {
    const userProductAsset = findUserAsset(['product', 'screen_recording', 'dashboard']);
    if (userProductAsset) {
      return {
        intent: 'product',
        broll: {
          query: userProductAsset.label || userProductAsset.name,
          title: userProductAsset.name,
          sourceUrl: userProductAsset.url,
          previewUrl: userProductAsset.url,
          mediaType: 'image',
          visual_intent: 'product',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.2,
          duration: 3.0,
          badgeTag: 'REAL PRODUCT DEMO',
          entryTransition: 'zoom_in',
        },
        directorNote: `Priority 1 User Asset: Displaying authentic uploaded product photo (${userProductAsset.name}) during solution presentation.`,
      };
    }

    if (isAffiliate || textUpper.includes('KERANJANG') || textUpper.includes('PRODUK')) {
      const match = EXTENDED_STOCK_CATALOG.find((c) => c.id === 'product-mobile-tiktok-shop') || EXTENDED_STOCK_CATALOG[7];
      return {
        intent: 'product',
        broll: {
          query: 'Physical product live demo & in-use demonstration',
          title: match.title,
          sourceUrl: match.url,
          previewUrl: match.thumb,
          mediaType: match.type,
          visual_intent: 'product',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.2,
          duration: 3.0,
          badgeTag: match.badgeTag,
          entryTransition: 'zoom_in',
        },
        directorNote: 'Product Demonstration: Close-up video demo shows product solution actively working in real time.',
      };
    }

    if (isEducational || textUpper.includes('RISET') || textUpper.includes('LANGKAH') || textUpper.includes('CARA')) {
      const match = EXTENDED_STOCK_CATALOG.find((c) => c.id === 'process-market-validation') || EXTENDED_STOCK_CATALOG[4];
      return {
        intent: 'process',
        broll: {
          query: 'Market validation methodology step-by-step workflow',
          title: match.title,
          sourceUrl: match.url,
          previewUrl: match.thumb,
          mediaType: match.type,
          visual_intent: 'process',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.4,
          duration: 2.8,
          badgeTag: match.badgeTag,
          entryTransition: 'slide_left',
        },
        directorNote: 'Process Workflow: Step-by-step workflow overlay turns abstract concept into actionable steps.',
      };
    }

    // Default solution victory
    const match = EXTENDED_STOCK_CATALOG.find((c) => c.id === 'result-success-breakthrough') || EXTENDED_STOCK_CATALOG[10];
    return {
      intent: 'result',
      broll: {
        query: 'Successful transformation milestone & revenue win',
        title: match.title,
        sourceUrl: match.url,
        previewUrl: match.thumb,
        mediaType: match.type,
        visual_intent: 'result',
        overlay_style: 'pip',
        opacity: 0.95,
        startOffset: 0.2,
        duration: 2.6,
        badgeTag: match.badgeTag,
        entryTransition: 'fade',
      },
      directorNote: 'Solution Milestone: Positive result visual delivers emotional relief and validates the solution.',
    };
  }

  // =========================================================================
  // STAGE 6: CALL TO ACTION (CTA)
  // Direct conversion push with optional micro-urgency cue
  // =========================================================================
  if (role === 'cta' || index === totalScenes - 1) {
    const userCtaAsset = findUserAsset(['logo', 'product', 'screenshot']);
    if (userCtaAsset) {
      return {
        intent: 'urgency',
        broll: {
          query: userCtaAsset.label || userCtaAsset.name,
          title: userCtaAsset.name,
          sourceUrl: userCtaAsset.url,
          previewUrl: userCtaAsset.url,
          mediaType: 'image',
          visual_intent: 'urgency',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.3,
          duration: 2.5,
          badgeTag: 'BRAND LOGO PROMPT',
          entryTransition: 'zoom_in',
        },
        directorNote: `Authentic User Asset Attached: Using uploaded ${userCtaAsset.name} as closing CTA prompt.`,
      };
    }

    if (textUpper.includes('KERANJANG') || textUpper.includes('CHECKOUT') || textUpper.includes('LINK') || textUpper.includes('BIO') || textUpper.includes('DAFTAR')) {
      const match = isAffiliate
        ? EXTENDED_STOCK_CATALOG.find((c) => c.id === 'product-mobile-tiktok-shop') || EXTENDED_STOCK_CATALOG[7]
        : EXTENDED_STOCK_CATALOG.find((c) => c.id === 'urgency-cta-action') || EXTENDED_STOCK_CATALOG[8];

      return {
        intent: 'urgency',
        broll: {
          query: 'Direct action conversion trigger & bio link click prompt',
          title: match.title,
          sourceUrl: match.url,
          previewUrl: match.thumb,
          mediaType: match.type,
          visual_intent: 'urgency',
          overlay_style: 'pip',
          opacity: 0.95,
          startOffset: 0.3,
          duration: 2.5,
          badgeTag: match.badgeTag,
          entryTransition: 'zoom_in',
        },
        directorNote: 'Closing CTA Urgency: Speaker eye-contact maintained with interactive action prompt to direct immediate viewer tap/click.',
      };
    }

    return {
      intent: 'none',
      broll: null,
      directorNote: 'Direct CTA Conviction: 100% human eye-contact produces highest direct-response conversion rate.',
    };
  }

  // Default clean talking-head delivery
  return {
    intent: 'none',
    broll: null,
    directorNote: 'Clean talking-head focus with dynamic camera reframing and high-contrast caption emphasis.',
  };
}
