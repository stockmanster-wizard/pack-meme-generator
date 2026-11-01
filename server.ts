/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  THE_PACK_ENGINE_SYSTEM_INSTRUCTION,
  PackMemePlan,
  SUBJECT_ARCHETYPES,
  ATMOSPHERIC_ASSETS,
  WILDCARD_ADJECTIVES,
  WILDCARD_NOUNS,
  PHASE1_HOOK_STYLES,
  PHASE2_TOPIC_BUCKETS,
  Phase1HookStyle,
  Phase2TopicBucket,
  RENDERING_STYLE_PRESETS,
  RenderingStylePreset,
} from './src/services/packRules.js';
import { StyleMemoryBank } from './src/services/styleMemory.js';
import {
  getStoredConfig,
  saveStoredConfig,
  saveDispatchLog,
} from './src/services/firestoreService.js';
import {
  sendServerPackMemeEmail,
  setServerCachedAccessToken,
  isServerEmailConfigured,
} from './src/services/gmailServerSender.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const recentHookStyleIds: string[] = [];
const recentTopicBucketIds: string[] = [];
const MAX_TRACKED_HISTORY = 4;

// Programmatic Subject Selector across the full 14 archetypes (uniform Math.random)
function pickSubjectArchetype(): { archetype: string; isWildcard: boolean } {
  const index = Math.floor(Math.random() * SUBJECT_ARCHETYPES.length);
  const chosen = SUBJECT_ARCHETYPES[index];
  if (chosen === 'WILDCARD_PROCEDURAL_ARCHETYPE') {
    const adj = WILDCARD_ADJECTIVES[Math.floor(Math.random() * WILDCARD_ADJECTIVES.length)];
    const noun = WILDCARD_NOUNS[Math.floor(Math.random() * WILDCARD_NOUNS.length)];
    const proceduralCombo = `${adj} ${noun}`;

    return {
      archetype: `DYNAMIC PROCEDURAL WILDCARD: ${proceduralCombo}. Portray this character with full unhinged heavy-metal intensity, biker camaraderie, and over-the-top attitude.`,
      isWildcard: true,
    };
  }
  return { archetype: chosen, isWildcard: false };
}

// Programmatic Atmospheric Pair Selector (two distinct assets from pool)
function pickAtmosphericPair(): [string, string] {
  const firstIndex = Math.floor(Math.random() * ATMOSPHERIC_ASSETS.length);
  let secondIndex = Math.floor(Math.random() * ATMOSPHERIC_ASSETS.length);
  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * ATMOSPHERIC_ASSETS.length);
  }
  return [ATMOSPHERIC_ASSETS[firstIndex], ATMOSPHERIC_ASSETS[secondIndex]];
}

// Uniform Rendering Style Preset Selector across the 5 distinct rendering styles
function pickRenderingPreset(): RenderingStylePreset {
  const index = Math.floor(Math.random() * RENDERING_STYLE_PRESETS.length);
  return RENDERING_STYLE_PRESETS[index];
}

// 1/3 Probability Length Tier Selector for Phase 2 Bottom Text
function pickLengthTier(): { tier: 'short' | 'medium' | 'long'; wordGuideline: string } {
  const rand = Math.random();
  if (rand < 1 / 3) {
    return {
      tier: 'short',
      wordGuideline: 'EXACT LENGTH TIER: SHORT (between 4 and 8 words). Make it punchy, aggressive, and direct.',
    };
  } else if (rand < 2 / 3) {
    return {
      tier: 'medium',
      wordGuideline: 'EXACT LENGTH TIER: MEDIUM (between 9 and 15 words). Classic balanced r/THE_PACK subversion.',
    };
  } else {
    return {
      tier: 'long',
      wordGuideline: 'EXACT LENGTH TIER: LONG (between 16 and 24 words). An epic, unhinged, ultra-specific over-explanation.',
    };
  }
}

// Rolling De-Duplicated Phase 1 Hook Style Selector
function pickHookStyle(): Phase1HookStyle {
  const available = PHASE1_HOOK_STYLES.filter((h) => !recentHookStyleIds.includes(h.id));
  const pool = available.length > 0 ? available : PHASE1_HOOK_STYLES;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  recentHookStyleIds.push(chosen.id);
  if (recentHookStyleIds.length > MAX_TRACKED_HISTORY) {
    recentHookStyleIds.shift();
  }

  return chosen;
}

// Rolling De-Duplicated Phase 2 Topic Bucket Selector
function pickTopicCategory(): Phase2TopicBucket {
  const available = PHASE2_TOPIC_BUCKETS.filter((t) => !recentTopicBucketIds.includes(t.id));
  const pool = available.length > 0 ? available : PHASE2_TOPIC_BUCKETS;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  recentTopicBucketIds.push(chosen.id);
  if (recentTopicBucketIds.length > MAX_TRACKED_HISTORY) {
    recentTopicBucketIds.shift();
  }

  return chosen;
}

// Step 1: Dynamic 2-Phase Copywriting & Asset Prompt Synthesis via LLM
async function planPackMeme(
  subjectInfo: { archetype: string; isWildcard: boolean },
  atmosphericPair: [string, string],
  renderingPreset: RenderingStylePreset
): Promise<PackMemePlan & { renderingPresetId?: string }> {
  const hookStyle = pickHookStyle();
  const topicBucket = pickTopicCategory();
  const lengthConfig = pickLengthTier();
  const learnedDirectives = StyleMemoryBank.getActiveCorrectionDirectives();
  const learnedRulesBlock = learnedDirectives.length > 0
    ? `\nACTIVE LEARNED RULES (FROM RECENT VISION REVIEWS):\n${learnedDirectives.map((d) => `- ${d}`).join('\n')}\n`
    : '';

  const prompt = `Generate a fresh, original, authentic r/THE_PACK meme adhering strictly to your system instructions.

MANDATORY ASSIGNED SUBJECT ARCHETYPE (Programmatically pre-selected):
${subjectInfo.archetype}

MANDATORY ASSIGNED ATMOSPHERIC ASSETS (Programmatically pre-selected):
- Atmosphere 1: ${atmosphericPair[0]}
- Atmosphere 2: ${atmosphericPair[1]}

MANDATORY VISUAL RENDERING STYLE: ${renderingPreset.name} (${renderingPreset.coreDirectives})

TOP TEXT (PHASE 1) HOOK DIRECTIVE:
Follow ${hookStyle.name}: ${hookStyle.directive}

BOTTOM TEXT (PHASE 2) TOPIC DIRECTIVE:
Focus specifically on the theme of ${topicBucket.name}: ${topicBucket.directive}

SELECTED BOTTOM TEXT LENGTH TIER (assigned with 1/3 probability):
${lengthConfig.wordGuideline}
CRITICAL: Phase 2 MUST strictly follow this exact length tier (${lengthConfig.tier}). Do not exceed or undercut this word range.
${learnedRulesBlock}
Ensure Phase 1 is a bold 3-8 word aggressive hook in FULL UPPERCASE spoken in the unhinged earnest voice of this character that sets up maximum dramatic contrast, and ensure Phase 2 resolves with extreme specificity to the chosen theme of ${topicBucket.name}.
Generate a unique ALL CAPS Pack subject line based on the meme.
Assemble the complete end-to-end image prompt formatted with:
- ${renderingPreset.coreDirectives}
- Large 3D extruded Microsoft WordArt 2003 text with isometric hard 3D extruded drop shadows (no blur), harsh horizontal reflective chrome gradient bands, and heavy 6px-8px solid black outer strokes. Prevent modern flat sans-serifs or soft drop glows.
- Zero compositional safety margins: subject and typography deliberately overlap and crowd the canvas rather than framing the edges.
- Raw, full-bleed composition, direct digital art file, edge-to-edge canvas coverage. Exclude: ${renderingPreset.negativeExclusions} Absolutely NO t-shirt, no shirt, no apparel, no mockup, no product photography, no hanger, no flat lay, no fabric texture, no cotton, no collar, no sleeves, no borders, no margins, no padding, zero letterboxing.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: THE_PACK_ENGINE_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subjectChoice: {
            type: Type.STRING,
            description: 'Selected primary subject from the approved list',
          },
          atmosphere1: {
            type: Type.STRING,
            description: 'First chosen atmospheric asset',
          },
          atmosphere2: {
            type: Type.STRING,
            description: 'Second chosen atmospheric asset',
          },
          phase1Hook: {
            type: Type.STRING,
            description: 'Aggressive hook, 3-8 words, ALL CAPS',
          },
          phase2Resolution: {
            type: Type.STRING,
            description: `Prosocial/domestic subversion in ALL CAPS adhering to ${lengthConfig.wordGuideline}`,
          },
          emailSubject: {
            type: Type.STRING,
            description: 'Catchy unique Pack subject line for email, ALL CAPS',
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'Complete synthesized prompt for image generation',
          },
        },
        required: [
          'subjectChoice',
          'atmosphere1',
          'atmosphere2',
          'phase1Hook',
          'phase2Resolution',
          'emailSubject',
          'imagePrompt',
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}') as PackMemePlan & { renderingPresetId?: string };
  parsed.renderingPresetId = renderingPreset.id;
  return parsed;
}

// Helper: Sanitize prompt and inject preset-specific full-bleed medium framing + negative exclusions
function sanitizeAndFramePrompt(rawPrompt: string, preset: RenderingStylePreset): string {
  // Always strip apparel and merchandise mockup terms
  let sanitized = rawPrompt.replace(
    /\b(t-?shirts?|tees?|shirts?|merch|clothing mockups?|hangers?|flat lays?|apparels?)\b/gi,
    'artwork'
  );

  // Only strip comic/painterly terms when NOT using PULP_SCREENPRINT, FANTASY_SPLASH_ART, or CLASSICAL_OIL_REALISM
  if (
    preset.id !== 'PULP_SCREENPRINT' &&
    preset.id !== 'FANTASY_SPLASH_ART' &&
    preset.id !== 'CLASSICAL_OIL_REALISM'
  ) {
    sanitized = sanitized.replace(
      /\b(comic book art|cell shading|clean black ink outlines|vector illustration|modern sticker graphic)\b/gi,
      preset.name
    );
  }

  const learnedDirectives = StyleMemoryBank.getActiveCorrectionDirectives();
  const learnedBlock = learnedDirectives.length > 0
    ? `\nACTIVE LEARNED RULES (FROM RECENT VISION REVIEWS):\n${learnedDirectives.map((d) => `- ${d}`).join('\n')}\n`
    : '';

  return `${preset.coreDirectives} Raw, full-bleed composition, direct digital art file, edge-to-edge canvas coverage.
${sanitized}
${learnedBlock}
TYPOGRAPHY & COMPOSITION SPECIFICATION: Large 3D extruded Microsoft WordArt 2003 text with isometric hard 3D extruded drop shadows (no blur), harsh horizontal reflective chrome/color gradient bands, and heavy 6px-8px solid black outer strokes. Prevent modern flat sans-serifs or soft drop glows. Zero compositional safety margins: subject and typography deliberately overlap and crowd the canvas rather than framing the edges. Full-bleed edge-to-edge coverage, no borders, no margins, no padding, zero letterboxing.
NEGATIVE PROMPT & EXCLUSIONS: ${preset.negativeExclusions} balanced margins, soft drop shadows, modern flat sans-serifs, soft drop glow, t-shirt, shirt, clothing, apparel, mockup, product photography, hanger, flat lay, fabric texture, cotton, collar, sleeves, border, margins, white border, black border, letterboxing, frame, padding, vignette cutout.`;
}

// Step 2: Image Generation via Gemini
async function generateGeminiImage(
  imagePrompt: string,
  preset: RenderingStylePreset
): Promise<{ rawBase64: string; imageUrl: string }> {
  const finalPrompt = sanitizeAndFramePrompt(imagePrompt, preset);

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-image',
    contents: {
      parts: [
        {
          text: finalPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const rawBase64 = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return {
        rawBase64,
        imageUrl: `data:${mimeType};base64,${rawBase64}`,
      };
    }
  }

  throw new Error('Gemini model did not return image data.');
}

export interface StyleEvaluationResult {
  passed: boolean;
  specificDefects: string[];
  targetedPromptFixes: string[];
  styleNotes: string;
}

// Step 3: Loose Preset-Aware Post-Generation Vision Style Inspector
async function evaluatePackStyle(
  rawBase64: string,
  preset: RenderingStylePreset
): Promise<StyleEvaluationResult> {
  try {
    const evalResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: rawBase64,
            },
          },
          {
            text: `You are a visual style reviewer for memes based on Reddit's r/THE_PACK.
Assigned Rendering Style Preset: ${preset.name} (${preset.id})
Style criteria for this preset:
- Target visual medium: ${preset.reviewerCriteria}
- Core directives: ${preset.coreDirectives}
- Preset-specific allowances:
  * If PULP_SCREENPRINT: Ben-Day halftone dots, CMYK rosette screens, heavy ink linework, and print misregistration are explicitly required and valid.
  * If FANTASY_SPLASH_ART: Painterly visible brushwork, volumetric layering, and thermal under-glow are explicitly required and valid.
  * If MACRO_STUDIO_PHOTO: Realistic macro studio still life photography with shallow depth of field and directional softbox lighting is explicitly required and valid.
  * If CLASSICAL_OIL_REALISM: Classical academic oil painting with diffuse natural window light and canvas tooth texture is explicitly required and valid.
  * If AIRBRUSH_HEAVY_METAL: 1980s-1990s dark fantasy airbrush illustration with high-contrast chiaroscuro and rim lighting is explicitly required and valid.
- Universal exclusions to avoid: ${preset.negativeExclusions} t-shirt collars, apparel mockups, hangers, or borders/letterboxing.
- LOOSE EVALUATION RULE: Do NOT be pedantic or rigid. Validate against the assigned preset (${preset.name}) rather than assuming airbrush. Only set passed to false if it has true defects such as borders/margins/letterboxing, apparel/t-shirt mockups, or complete failure to match the assigned medium (${preset.name}).

Return valid JSON with:
{
  "passed": boolean,
  "specificDefects": string[],
  "targetedPromptFixes": string[],
  "styleNotes": string
}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: {
              type: Type.BOOLEAN,
              description: `True if image matches ${preset.name} without borders or apparel mockups, false only on true medium failure or framing defects`,
            },
            specificDefects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific visual defects identified',
            },
            targetedPromptFixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Targeted imperative prompt fixes to correct the exact defects found',
            },
            styleNotes: {
              type: Type.STRING,
              description: 'Short 1-sentence summary of the style inspection',
            },
          },
          required: ['passed', 'specificDefects', 'targetedPromptFixes', 'styleNotes'],
        },
      },
    });

    const parsed = JSON.parse(evalResponse.text?.trim() || '{}') as StyleEvaluationResult;
    return {
      passed: Boolean(parsed.passed),
      specificDefects: Array.isArray(parsed.specificDefects) ? parsed.specificDefects : [],
      targetedPromptFixes: Array.isArray(parsed.targetedPromptFixes) ? parsed.targetedPromptFixes : [],
      styleNotes: parsed.styleNotes || `Captured authentic ${preset.name} aesthetic.`,
    };
  } catch (e) {
    console.warn('Style evaluation skipped or failed:', e);
    return {
      passed: true,
      specificDefects: [],
      targetedPromptFixes: [],
      styleNotes: 'Style check passed.',
    };
  }
}

// Main Endpoint: Full Automated Pipeline with Continuous Style Feedback Loop
app.post('/api/meme/generate', async (_req: Request, res: Response) => {
  try {
    // 1. Programmatically pre-select subject archetype, atmospheric pair, & rendering preset for uniform variety
    const subjectInfo = pickSubjectArchetype();
    const atmosphericPair = pickAtmosphericPair();
    const renderingPreset = pickRenderingPreset();

    // 2. Dynamic Copywriting & Theme Plan (automatically reads active learned rules)
    const plan = await planPackMeme(subjectInfo, atmosphericPair, renderingPreset);

    // 3. Generate Image
    let imageResult = await generateGeminiImage(plan.imagePrompt, renderingPreset);
    let wasRefined = false;

    // 4. Post-Generation Vision Style Review
    const styleCheck = await evaluatePackStyle(imageResult.rawBase64, renderingPreset);

    // 5. Auto-refine if style check flagged defects
    if (!styleCheck.passed) {
      console.log('[Style Reviewer] Defects flagged:', styleCheck.specificDefects);
      wasRefined = true;

      // Apply targetedPromptFixes directly to retry attempt using the selected preset's coreDirectives
      const fixesString = styleCheck.targetedPromptFixes.length > 0
        ? `\n\nTARGETED VISION FIXES FOR THIS RETRY:\n${styleCheck.targetedPromptFixes.map((f) => `- ${f}`).join('\n')}`
        : '';
      const refinedPrompt = `${plan.imagePrompt}${fixesString}\n\nCRITICAL ENHANCEMENT (${renderingPreset.name}): ${renderingPreset.coreDirectives} Large 3D extruded Microsoft WordArt 2003 text with isometric hard 3D extruded drop shadows (no blur), harsh horizontal reflective chrome/color gradient bands, and heavy 6px-8px solid black outer strokes. Zero compositional safety margins: subject and typography deliberately overlap and crowd the canvas. Exclude: ${renderingPreset.negativeExclusions} No borders, no margins, no letterboxing.`;

      imageResult = await generateGeminiImage(refinedPrompt, renderingPreset);

      // Record feedback into StyleMemoryBank so future generations learn
      StyleMemoryBank.recordFeedback(styleCheck.specificDefects, styleCheck.targetedPromptFixes, false);
    } else {
      // Record success into StyleMemoryBank to reinforce authentic patterns
      StyleMemoryBank.recordFeedback(
        [],
        [`Maintain authentic rendering style preset execution and isometric 3D extruded WordArt`],
        true
      );
    }

    res.json({
      success: true,
      imageUrl: imageResult.imageUrl,
      rawBase64: imageResult.rawBase64,
      subject: plan.emailSubject,
      phase1Hook: plan.phase1Hook,
      phase2Resolution: plan.phase2Resolution,
      subjectChoice: plan.subjectChoice,
      atmosphere1: plan.atmosphere1,
      atmosphere2: plan.atmosphere2,
      styleNotes: styleCheck.styleNotes,
      wasRefined,
    });
  } catch (error: any) {
    console.error('Gemini image generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meme image with Gemini.',
    });
  }
});

// Reusable server-side pipeline for generating a fresh verified Pack meme
async function generateVerifiedServerMeme() {
  const subjectInfo = pickSubjectArchetype();
  const atmosphericPair = pickAtmosphericPair();
  const renderingPreset = pickRenderingPreset();
  const plan = await planPackMeme(subjectInfo, atmosphericPair, renderingPreset);

  let imageResult = await generateGeminiImage(plan.imagePrompt, renderingPreset);
  let wasRefined = false;

  const styleCheck = await evaluatePackStyle(imageResult.rawBase64, renderingPreset);

  if (!styleCheck.passed) {
    console.log('[Style Reviewer] Defects flagged:', styleCheck.specificDefects);
    wasRefined = true;
    const fixesString =
      styleCheck.targetedPromptFixes.length > 0
        ? `\n\nTARGETED VISION FIXES FOR THIS RETRY:\n${styleCheck.targetedPromptFixes.map((f) => `- ${f}`).join('\n')}`
        : '';
    const refinedPrompt = `${plan.imagePrompt}${fixesString}\n\nCRITICAL ENHANCEMENT (${renderingPreset.name}): ${renderingPreset.coreDirectives} Large 3D extruded Microsoft WordArt 2003 text with isometric hard 3D extruded drop shadows (no blur), harsh horizontal reflective chrome/color gradient bands, and heavy 6px-8px solid black outer strokes. Zero compositional safety margins: subject and typography deliberately overlap and crowd the canvas. Exclude: ${renderingPreset.negativeExclusions} No borders, no margins, no letterboxing.`;

    imageResult = await generateGeminiImage(refinedPrompt, renderingPreset);
    StyleMemoryBank.recordFeedback(styleCheck.specificDefects, styleCheck.targetedPromptFixes, false);
  } else {
    StyleMemoryBank.recordFeedback(
      [],
      [`Maintain authentic rendering style preset execution and isometric 3D extruded WordArt`],
      true
    );
  }

  return {
    imageUrl: imageResult.imageUrl,
    rawBase64: imageResult.rawBase64,
    subject: plan.emailSubject,
    phase1Hook: plan.phase1Hook,
    phase2Resolution: plan.phase2Resolution,
    subjectChoice: plan.subjectChoice,
    atmosphere1: plan.atmosphere1,
    atmosphere2: plan.atmosphere2,
    styleNotes: styleCheck.styleNotes,
    wasRefined,
  };
}

// Config Endpoints: Read and persist recipient & schedule configurations via Firestore
app.get('/api/config', async (_req: Request, res: Response) => {
  try {
    const config = await getStoredConfig();
    if (
      config.autoSendEnabled &&
      config.nextScheduledRunAt &&
      config.nextScheduledRunAt > 0 &&
      Date.now() >= config.nextScheduledRunAt
    ) {
      executeAutonomousDispatch().catch((err) => {
        console.error('[GET /api/config] Background overdue dispatch error:', err?.message || err);
      });
    }
    res.json({ success: true, config, emailConfigured: isServerEmailConfigured() });
  } catch (error: any) {
    console.error('GET /api/config error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load config' });
  }
});

app.post('/api/config', async (req: Request, res: Response) => {
  try {
    const { accessToken, ...configUpdates } = req.body || {};
    if (accessToken && typeof accessToken === 'string') {
      setServerCachedAccessToken(accessToken);
    }
    const updated = await saveStoredConfig(configUpdates);
    res.json({ success: true, config: updated, emailConfigured: isServerEmailConfigured() });
  } catch (error: any) {
    console.error('POST /api/config error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save config' });
  }
});

// Direct send endpoint for web client (uses server credentials, e.g. Gmail App Password)
app.post('/api/meme/send', async (req: Request, res: Response) => {
  try {
    const {
      toRecipients,
      ccRecipient,
      bccRecipients,
      subject,
      rawBase64Png,
      isDebraCare,
      accessToken,
    } = req.body || {};

    const result = await sendServerPackMemeEmail({
      accessToken,
      toRecipients: toRecipients || [],
      ccRecipient,
      bccRecipients,
      subject,
      rawBase64Png,
      isDebraCare,
    });

    res.json(result);
  } catch (error: any) {
    console.error('POST /api/meme/send error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send meme email via server.',
    });
  }
});

// Autonomous Server Dispatch Execution
let isRunningAutonomousDispatch = false;

async function executeAutonomousDispatch(explicitAccessToken?: string) {
  if (isRunningAutonomousDispatch) {
    return { skipped: true, reason: 'Dispatch already in progress' };
  }
  isRunningAutonomousDispatch = true;
  try {
    const config = await getStoredConfig();
    const meme = await generateVerifiedServerMeme();
    const isCrewMode = config.mode === 'pack_automation';
    const bccList = isCrewMode ? config.friendEmails : [];

    let sendRes: Awaited<ReturnType<typeof sendServerPackMemeEmail>>;
    try {
      sendRes = await sendServerPackMemeEmail({
        accessToken: explicitAccessToken,
        toRecipients: [config.selfEmail],
        ccRecipient: isCrewMode ? undefined : config.selfEmail,
        bccRecipients: bccList,
        subject: meme.subject,
        rawBase64Png: meme.rawBase64,
      });
    } catch (emailErr: any) {
      const errNow = Date.now();
      const errMsg = emailErr?.message || 'Gmail API OAuth or send failure';
      console.error('[Autonomous Dispatch] Gmail send error:', errMsg);
      await saveDispatchLog({
        id: `cron_email_err_${errNow}`,
        timestamp: errNow,
        subject: meme.subject || 'Autonomous Dispatch OAuth/Email Failure',
        recipients: [config.selfEmail, ...bccList],
        cc: isCrewMode ? '' : config.selfEmail,
        mode: config.mode,
        status: 'failed',
        error: errMsg,
      }).catch(() => {});
      throw emailErr;
    }

    const now = Date.now();
    const intervalMs = Math.max(1, Number(config.intervalMinutes) || 1440) * 60 * 1000;
    const nextRun = config.autoSendEnabled ? now + intervalMs : null;

    const updatedConfig = await saveStoredConfig({
      lastSentAt: now,
      lastSentSubject: meme.subject,
      lastSentMode: config.mode,
      nextScheduledRunAt: nextRun,
      lastError: null,
    });

    await saveDispatchLog({
      id: `cron_${now}`,
      timestamp: now,
      subject: meme.subject,
      recipients: [config.selfEmail, ...bccList],
      cc: isCrewMode ? '' : config.selfEmail,
      mode: config.mode,
      status: 'success',
      messageId: sendRes.messageId,
    });

    return {
      success: true,
      messageId: sendRes.messageId,
      meme,
      config: updatedConfig,
    };
  } catch (error: any) {
    const now = Date.now();
    const errMsg = error?.message || 'Unknown autonomous dispatch error';
    const config = await getStoredConfig().catch(() => null);
    if (config) {
      const intervalMs = Math.max(1, Number(config.intervalMinutes) || 1440) * 60 * 1000;
      await saveStoredConfig({
        nextScheduledRunAt: config.autoSendEnabled ? now + intervalMs : null,
        lastError: errMsg,
      }).catch(() => {});
      await saveDispatchLog({
        id: `cron_err_${now}`,
        timestamp: now,
        subject: 'Autonomous Dispatch Error',
        recipients: [config.selfEmail],
        cc: '',
        mode: config.mode,
        status: 'failed',
        error: errMsg,
      }).catch(() => {});
    }
    throw error;
  } finally {
    isRunningAutonomousDispatch = false;
  }
}

app.post('/api/cron/dispatch', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body || {};
    if (accessToken && typeof accessToken === 'string') {
      setServerCachedAccessToken(accessToken);
    }
    const result = await executeAutonomousDispatch(accessToken);
    res.json(result);
  } catch (error: any) {
    console.error('POST /api/cron/dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Autonomous cron dispatch failed.',
    });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  // Hydrate persistent StyleMemoryBank from Firestore on boot
  await StyleMemoryBank.hydrateFromFirestore();

  // Start autonomous server-side background scheduler loop (checks every 15 seconds)
  setInterval(async () => {
    try {
      const config = await getStoredConfig();
      if (
        config.autoSendEnabled &&
        config.nextScheduledRunAt &&
        config.nextScheduledRunAt > 0 &&
        Date.now() >= config.nextScheduledRunAt
      ) {
        console.log('[Autonomous Scheduler] Triggering scheduled Pack meme dispatch...');
        await executeAutonomousDispatch();
      }
    } catch (err: any) {
      console.warn('[Autonomous Scheduler] Background run notice:', err.message || err);
    }
  }, 15000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Pack Meme Blaster server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
