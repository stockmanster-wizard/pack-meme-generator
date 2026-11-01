/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUBJECT_ARCHETYPES = [
  // Original Five
  'Biker Skeleton riding a roaring custom chopper motorcycle with flaming chrome exhaust pipes',
  'Ancient Arcane Wizard with long silver beard casting thunder and lightning from a crystal staff',
  'Blood Moon Werewolf howling ferociously at a giant crimson celestial moon',
  'Volcanic Dragon breathing torrents of golden flame atop an obsidian mountain crag',
  'Norse Viking Warrior with horned iron helm and twin bearded battleaxes in a blizzard',

  // Classic Heavy Metal Fantasy
  'Skeletal Grim Reaper in spiked leather vest shredding an electric guitar or wielding a flaming scythe',
  'Muscular Horned Demon wrapped in glowing chains with smoldering eyes and sulfur smoke',
  'Gothic Stone Gargoyle Sentinel perched atop cathedral spires amidst an electric storm',
  'Undead Armored Death Knight in spiked battle plate armor wielding a glowing broadsword',
  'Cerberus Three-Headed Hellhound snarling with fire dripping from iron-jawed collars',

  // Sci-Fi & Cybernetic Beasts
  'Bionic Cyber-Wolf with glowing ocular implants, chrome spine, and cybernetic exoskeleton',
  'Neon Mecha-Demon in spiked high-tech titanium armor with hydraulic claw appendages',
  'Cosmic Plasma Space Biker on a roaring hovering anti-grav chopper racing across nebulas',

  // Wildcard Token for Procedural Generation
  'WILDCARD_PROCEDURAL_ARCHETYPE',
] as const;

export type SubjectArchetype = (typeof SUBJECT_ARCHETYPES)[number];

export const WILDCARD_ADJECTIVES = [
  'Hell-bent', 'Chrome-plated', 'Rust-bitten', 'Bloodshot', 'Feral',
  'Unhinged', 'Gutter-born', 'Thunderous', 'Spike-collared', 'Chain-whipped',
  'Grizzled', 'Brimstone-soaked', 'Venomous', 'Overclocked', 'Bone-crushing',
  'Rabid', 'Void-touched', 'Neon-scorched', 'Splintered', 'Lawless',
  'Asphalt-scraped', 'Gargantuan', 'Moon-mad', 'Sledgehammer', 'Vengeance-fueled',
] as const;

export const WILDCARD_NOUNS = [
  'Brawler', 'Warlock', 'Hellhound', 'Paladin', 'Gargoyle',
  'Berserker', 'Scavenger', 'Drifter', 'Warmonger', 'Inquisitor',
  'Gunslinger', 'Chimera', 'Necromancer', 'Outlaw', 'Marauder',
  'Behemoth', 'Zealot', 'Ranger', 'Gladiator', 'Revenant',
  'Enforcer', 'Monk', 'Hydra', 'Slayer', 'Sorcerer',
  'Juggernaut', 'Warden', 'Vagabond', 'Minotaur', 'Assassin',
  'Brigand', 'Crusader', 'Wretch', 'Ghoul', 'Barbarian',
  'Sellsword', 'Apex', 'Bounty-Hunter', 'Rogue', 'Banshee',
  'Executioner', 'Druid', 'Vanguard', 'Predator', 'Artificer',
  'Howler', 'Warmachine', 'Reaper', 'Desperado', 'Nomad',
] as const;

export const ATMOSPHERIC_ASSETS = [
  'Rolling hellfire, inferno explosions, and backfiring exhausts',
  'Blue and toxic green crackling lightning bolts arcing across stormy skies',
  'Barbed wire, heavy anchor chains, and chrome bullet holes',
  'Shattered highway asphalt, thick smoke plumes, and blinding lens flares',
  'Volcanic molten lava rivers, fiery smoke geysers, and flying red embers',
  'Violent blizzard snowfall, frozen frost crags, and aurora borealis streaks',
  'Neon synthwave grid horizon, laser beams, and retro chrome reflections',
  'Gothic storm clouds, blood-red thunderstorm skies, and supernatural aura',
] as const;

export const THE_PACK_ENGINE_SYSTEM_INSTRUCTION = `
You are an automated generation engine specialized in creating memes adhering strictly to the subculture and visual language of r/THE_PACK.

## Core Formula: The Tonal Collision
Every output must balance two diametrically opposed forces:
- The Visuals: Hyper-aggressive, mid-2000s masculine bravado across diverse heavy-metal archetypes:
  * Original Five: Biker Skeletons, Arcane Wizards, Werewolves, Volcanic Dragons, Norse Vikings.
  * Heavy Metal Fantasy: Grim Reapers, Horned Demons, Gargoyles, Death Knights, Cerberus Hellhounds.
  * Sci-Fi Cybernetic Beasts: Bionic Cyber-Wolves, Mecha-Demons, Cosmic Plasma Space Bikers.
  * Procedural Wildcards: Unique mythic beasts, dieselpunk/steampunk figures, Greek titans, or cloud beasts.
- The Message: Radically mundane, highly considerate, emotionally mature, health-conscious, domestic, or boundary-respecting sentiments (including Debra care, kids' homework/sports, home maintenance). Regardless of whether the character is a wizard, a dragon, a cyber-wolf, or a demon, they speak with the unhinged earnest biker camaraderie of r/THE_PACK!

## Generation Rules & Parameters

### Rule 1: Visual Theme Integration
Incorporate the assigned Subject Archetype, Atmospheric Assets, and Rendering Style Preset into a coherent, high-energy scene.
If assigned the WILDCARD archetype, invent an original, unhinged heavy-metal fantasy / dieselpunk / mythic character (e.g., Arcane Minotaur, Steampunk Centaur, Dieselpunk Samurai, Mountain Titan).

- Mandatory Rendering Style Directive:
  Strictly adhere to the assigned Rendering Style Preset's core visual directives and negative exclusions provided in the prompt. Deliver a raw, full-bleed composition with direct edge-to-edge canvas coverage.
  Always exclude: "t-shirt, shirt, clothing, apparel, mockup, product photography, hanger, flat lay, fabric texture, cotton, collar, sleeves, border, margins, white border, black border, letterboxing, frame, padding, vignette cutout."

### Rule 2: Copywriting Architecture (2-Phase ALL CAPS)
All text must be written in FULL UPPERCASE and follow a rigid two-part structural pivot:
1. Phase 1: High-stakes, aggressive, hyper-dramatic biker bark, dark confession, boast, or ultimatum. Must feel intense, dangerous, and gravelly. Strictly avoid cliché filler greetings.
2. Phase 2: The Prosocial / Domestic Subversion (Tiered Lengths with 1/3 Probability Each)
   - **SHORT (1/3 chance)**: 4 to 8 words. Punchy, sharp, high-impact subversion.
   - **MEDIUM (1/3 chance)**: 9 to 15 words. Classic balanced r/THE_PACK resolution.
   - **LONG (1/3 chance)**: 16 to 24 words. An epic, unhinged, ultra-specific over-explanation.
   - Topics are distributed evenly across:
     * Household & Maintenance: Air filters, dishwasher cycles, knife sharpening, pantry sorting, lawn care etiquette.
     * Physical Health & Ergonomics: Flossing, posture, hydration, sunscreen, regular sleep schedules, stretching.
     * Emotional Intelligence & Boundaries: Therapy, validating feelings without lashing out, respecting introversion, asking for consent.
     * Wholesome Leisure: Baking, tuning instruments, checking on elderly neighbors, packing a sensible lunch.
     * Wholesome Family & Debra Lore (Occasional ~10-15% easter egg): Debra recovery care ("family comes first!"), kids' sportsmanship, helping kids with math homework.

### Rule 3: Typography Specification
- Text Rendering: Large 3D extruded Microsoft WordArt 2003 text with isometric hard 3D extruded drop shadows (no blur), harsh horizontal reflective chrome gradient bands, and heavy 6px-8px solid black outer strokes. Prevent modern flat sans-serifs or soft drop glows.
- Top Line: Fire gradient (Deep red to Orange to Neon yellow), heavy 6px-8px solid black outer stroke, isometric hard 3D extruded drop shadow (no blur).
- Bottom Line: Harsh horizontal reflective chrome gradient bands with blue reflections OR Toxic lime gradient, isometric hard 3D extruded drop shadow (no blur).
- Canvas Placement & Anti-Margins: Zero compositional safety margins. The subject and typography must deliberately overlap, collide, and crowd the canvas rather than framing the edges. Center text aggressively across the subject's torso or face.

### Negative Guardrails
- No Absurdism / Random "Lulz": Must be grounded in recognizable adult responsibilities or emotional experiences.
- No Ironic Detachment: Deadpan, completely earnest, 100% committed to the biker persona.
- No Corporate Minimalism: Preserve the raw collision of intense visual craft and loud 2003 3D WordArt typography.
- Character Break: 100% ALL CAPS only.
`;

export interface RenderingStylePreset {
  id: 'AIRBRUSH_HEAVY_METAL' | 'PULP_SCREENPRINT' | 'FANTASY_SPLASH_ART' | 'MACRO_STUDIO_PHOTO' | 'CLASSICAL_OIL_REALISM';
  name: string;
  coreDirectives: string;
  negativeExclusions: string;
  reviewerCriteria: string;
}

export const RENDERING_STYLE_PRESETS: readonly RenderingStylePreset[] = [
  {
    id: 'AIRBRUSH_HEAVY_METAL',
    name: 'High-Gloss Dark Fantasy Airbrush',
    coreDirectives: '1980s-1990s dark fantasy airbrush digital illustration, high-contrast chiaroscuro, electric blue and fiery orange rim lighting, specular chrome and bone highlights, deep velvety black drop-shadows, atmospheric smoke and lightning.',
    negativeExclusions: 'flat vector, 3D render plasticity, modern clean digital art, soft pastel lighting, t-shirt, shirt, apparel, mockup, product photography, hanger, flat lay, fabric texture, border, margins, white border, letterboxing, frame, padding.',
    reviewerCriteria: 'Authentic 1980s-1990s dark fantasy airbrush illustration with high-contrast rim lighting and specular highlights.',
  },
  {
    id: 'PULP_SCREENPRINT',
    name: 'Vintage Pulp / Halftone Screenprint',
    coreDirectives: 'Mid-20th-century vintage four-color comic book pulp print simulation, visible Ben-Day halftone dots, CMYK rosette screens, heavy uneven black ink linework, intentional print misregistration, plate shifting, distressed fiber newsprint texture, limited spot-color gamut.',
    negativeExclusions: 'smooth digital gradients, photorealism, modern 3D shading, airbrushing, sleek vector art, t-shirt, apparel mockup, borders, margins, padding.',
    reviewerCriteria: 'Authentic mid-20th-century comic pulp print with visible Ben-Day halftone dots and ink plate misregistration.',
  },
  {
    id: 'FANTASY_SPLASH_ART',
    name: 'High-Fantasy Concept Art / Digital Matte Painting',
    coreDirectives: 'Painterly digital fantasy concept art splash illustration, visible textured brushwork, volumetric layering, dynamic internal glow, ambient occlusion, fiery under-lighting casting thermal amber and molten red tones, dynamic Dutch tilt perspective, floating sparks and embers.',
    negativeExclusions: 'flat lines, clip art, low-detail cartoon, studio photography, clean vector graphics, t-shirt, apparel mockup, borders, margins, padding.',
    reviewerCriteria: 'Painterly digital fantasy concept art splash with visible brush texturing and thermal volumetric under-glow.',
  },
  {
    id: 'MACRO_STUDIO_PHOTO',
    name: 'Photographic Macro Studio Still Life',
    coreDirectives: 'Realistic macro studio still life photography, shallow depth of field, single key directional softbox lighting, authentic oxidized bronze and bone patina textures, subtle specular reflections on cast metal, deep pitch-black studio backdrop, tactile fine-art realism.',
    negativeExclusions: 'illustration, cartoon, drawing, cel-shading, saturated neon glow effects, fantasy painting backgrounds, t-shirt, apparel mockup, borders, margins, padding.',
    reviewerCriteria: 'Realistic macro studio photography with directional softbox lighting and authentic real-world material patina.',
  },
  {
    id: 'CLASSICAL_OIL_REALISM',
    name: 'Classical Academic Oil Realism',
    coreDirectives: 'Classical academic fine art oil painting, realistic anatomical studies, soft diffuse natural window light, muted earthy palette (aged bone, raw wood, linen), visible canvas tooth texture and gouache/oil brush strokes, naturalistic cast shadows.',
    negativeExclusions: 'neon lighting, digital airbrush, comic halftone, high-gloss plastic finish, flat vector, t-shirt, apparel mockup, borders, margins, padding.',
    reviewerCriteria: 'Classical academic oil painting with diffuse natural window light and visible canvas tooth texture.',
  },
] as const;

export interface Phase1HookStyle {
  id: string;
  name: string;
  directive: string;
}

export interface Phase2TopicBucket {
  id: string;
  name: string;
  directive: string;
}

export const PHASE1_HOOK_STYLES: readonly Phase1HookStyle[] = [
  {
    id: 'confession',
    name: 'Dramatic Confession & Dark Admission',
    directive:
      'Open with an apocalyptic vulnerability or dark personal admission delivered with gravelly heavy-metal gravity, as if confessing a forbidden secret before pivoting to the wholesome punchline.',
  },
  {
    id: 'character_boast',
    name: 'Subject-Specific Dominance Boast',
    directive:
      'Flex the specific physical anatomy, lethal weapon, mechanical engine, or supernatural might of the assigned visual subject before pivoting to the domestic resolution.',
  },
  {
    id: 'ultimatum',
    name: 'Dire Boundary & Ultimatum',
    directive:
      'Draw an unbreakable line in the sand, issue a dire warning, or lay down a non-negotiable personal rule with outlaw intensity.',
  },
  {
    id: 'blood_oath',
    name: 'Solemn Blood Oath & Urgent Status Report',
    directive:
      'Swear a solemn blood oath or deliver an urgent, hyper-intense status report on your current feral state or mission.',
  },
  {
    id: 'battle_bark',
    name: 'High-Decibel Tactical Rally Bark',
    directive:
      'Deliver a high-decibel tactical command or outlaw rally cry that immediately seizes command of the room while strictly forbidding generic filler greetings like LISTEN UP or STEP ASIDE.',
  },
] as const;

export const PHASE2_TOPIC_BUCKETS: readonly Phase2TopicBucket[] = [
  {
    id: 'kitchen_appliance_care',
    name: 'Kitchen Appliance Maintenance & Cleaning',
    directive:
      'Focus on deep-cleaning kitchen appliances, descaling the coffee maker, wiping down the microwave interior, or keeping the toaster crumb tray spotless.',
  },
  {
    id: 'grocery_coupons',
    name: 'Grocery Store Coupons & Unit Price Triumphs',
    directive:
      'Focus on clipping grocery coupons, comparing per-ounce unit prices in the aisle, bringing reusable bags, or celebrating a BOGO deal on pantry staples.',
  },
  {
    id: 'sleep_hygiene',
    name: 'Sleep Hygiene & Bedtime Routine',
    directive:
      'Focus on getting a full eight hours of uninterrupted sleep, turning off screens before bed, setting a consistent alarm, or fluffing supportive pillows.',
  },
  {
    id: 'hydration_and_fiber',
    name: 'Hydration & Daily Dietary Fiber',
    directive:
      'Focus on drinking plenty of ice water, hitting daily soluble fiber goals, eating leafy greens, or keeping digestion smooth and regular.',
  },
  {
    id: 'ergonomic_posture',
    name: 'Ergonomic Posture & Joint Care',
    directive:
      'Focus on lumbar support, unclenching your jaw, dropping your shoulders away from your ears, or lifting heavy boxes with your legs instead of your back.',
  },
  {
    id: 'pet_devotion',
    name: 'Unconditional Pet Devotion & Gentle Care',
    directive:
      'Focus on spoiling a house pet, speaking in gentle baby-talk to a cat or dog, refilling their fresh water bowl, or never disturbing a pet sleeping on your lap.',
  },
  {
    id: 'plant_care',
    name: 'Houseplant & Garden Tending',
    directive:
      'Focus on checking soil moisture for houseplants, misting ferns, deadheading backyard flowers, or admiring a freshly sprouted tomato plant.',
  },
  {
    id: 'thermostat_monitoring',
    name: 'Thermostat Vigilance & Draft Prevention',
    directive:
      'Focus on keeping the household thermostat at a sensible temperature, sealing window drafts, or reminding everyone to close the front door so the AC stays inside.',
  },
  {
    id: 'leftovers_storage',
    name: 'Tupperware Matching & Leftovers Labeling',
    directive:
      'Focus on matching food storage lids to the right containers, labeling leftovers with painter tape and dates, or packing a nutritious home-cooked lunch.',
  },
  {
    id: 'laundry_care',
    name: 'Laundry Sorting & Fresh Bed Sheets',
    directive:
      'Focus on folding warm laundry immediately so it does not wrinkle, cleaning the dryer lint trap, separating delicates, or climbing into freshly washed bed sheets.',
  },
  {
    id: 'polite_driving',
    name: 'Polite Driving & Zipper-Merge Courtesy',
    directive:
      'Focus on executing a textbook zipper merge in traffic, using turn signals well in advance, giving a thank-you wave, or returning shopping carts to the corral.',
  },
  {
    id: 'punctuality',
    name: 'Punctuality & Calendar Preparedness',
    directive:
      'Focus on arriving fifteen minutes early to appointments, setting double calendar reminders, or laying out tomorrow outfit and keys the night before.',
  },
  {
    id: 'quiet_hobbies',
    name: 'Cozy Quiet Hobbies & Mindful Crafts',
    directive:
      'Focus on sorting edge pieces on a 1,000-piece jigsaw puzzle, identifying backyard songbirds with binoculars, baking sourdough bread, or doing a crossword in pen.',
  },
  {
    id: 'umbrella_preparedness',
    name: 'Weather Radar Tracking & Rain Gear Readiness',
    directive:
      'Focus on checking the Doppler weather radar before heading out, keeping a spare compact umbrella in the trunk, or wearing waterproof boots when rain is forecast.',
  },
  {
    id: 'hardware_tool_sorting',
    name: 'Pegboard Organization & Hardware Sorting',
    directive:
      'Focus on returning the 10mm socket to its exact pegboard slot, sorting spare screws into labeled jars, or oiling squeaky door hinges around the house.',
  },
  {
    id: 'emotional_check_ins',
    name: 'Sincere Emotional Check-Ins & Homie Validation',
    directive:
      'Focus on checking in on a friend mental health, validating someone feelings without trying to fix them, apologizing sincerely when wrong, or telling the homies you are proud of them.',
  },
  {
    id: 'skincare_spf_diligence',
    name: 'Daily SPF Sunscreen & Skincare Diligence',
    directive:
      'Focus on applying broad-spectrum SPF 50 sunscreen to the ears and neck, moisturizing dry knuckles in winter, or flossing every single tooth before bed.',
  },
  {
    id: 'tea_and_reading',
    name: 'Herbal Tea Steeping & Quiet Reading',
    directive:
      'Focus on steeping a mug of caffeine-free chamomile tea in the evening, reading a chapter of a good book before sleep, or enjoying a quiet porch sunset.',
  },
  {
    id: 'password_hygiene',
    name: 'Password Manager Hygiene & Software Updates',
    directive:
      'Focus on using a secure password manager, backing up family photos to an external drive, or safely ejecting USB flash drives before unplugging them.',
  },
  {
    id: 'couch_nap_protection',
    name: 'Sunday Afternoon Couch Nap & Blanket Fort Peace',
    directive:
      'Focus on wrapping up in a weighted fleece blanket on the sofa, putting the phone on Do Not Disturb, and protecting a glorious Sunday afternoon nap.',
  },
] as const;

export interface PackMemePlan {
  subjectChoice: string;
  atmosphere1: string;
  atmosphere2: string;
  phase1Hook: string;
  phase2Resolution: string;
  emailSubject: string;
  imagePrompt: string;
}
