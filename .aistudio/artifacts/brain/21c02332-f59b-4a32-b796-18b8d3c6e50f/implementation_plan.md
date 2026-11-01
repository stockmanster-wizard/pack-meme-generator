# Copywriting Variability & Anti-Repeat Engine Upgrade Plan

## Objective & Scope
Eliminate repetitive top-text openers (`"LISTEN UP"`, `"OUT OF THE WAY"`, `"STEP ASIDE"`) and recurring bottom-text punchlines by upgrading the meme planning pipeline in `src/services/packRules.ts`, `src/services/firestoreService.ts`, and `server.ts`.

---

## Root Cause Summary
1. **Literal Prompt Anchoring:** `THE_PACK_ENGINE_SYSTEM_INSTRUCTION` in `src/services/packRules.ts` currently hardcodes 6 literal example hooks (`LISTEN UP MFERS, HEY BROTHER, GET IN LINE, DON'T TEST ME, CRANKIN MY HOG, STEP ASIDE BROTHER`), causing `gemini-3-flash-preview` to repeatedly gravitate toward those exact openers.
2. **Missing Phase 1 Randomization:** Unlike visual archetypes, atmospheres, and length tiers, Phase 1 has no programmatic style selector.
3. **Narrow Phase 2 Topic Pool:** `pickTopicCategory()` in `server.ts` only rotates between 4 static strings containing 5 hardcoded example nouns each (dishwashers, air filters, flossing, posture).
4. **Stateless Caption Planning:** `planPackMeme()` has no memory of recently generated captions, allowing back-to-back runs to reuse opening words or domestic punchlines.

---

## Architectural & File Blueprint

### 1. `src/services/packRules.ts`
- **Remove Literal Hook Anchors:** Update `THE_PACK_ENGINE_SYSTEM_INSTRUCTION` so Phase 1 describes the structural contrast and tone without hardcoding the 6 repetitive example phrases (`LISTEN UP MFERS`, `STEP ASIDE BROTHER`, etc.).
- **Export `PHASE1_HOOK_STYLES` (5 Curated Hook Categories):**
  1. **Dramatic Confessions & Dark Secrets:** Admitting a deeply guarded personal truth or vulnerability with apocalyptic heavy-metal gravity.
  2. **Character-Specific Boasts Tied to the Visual Subject:** Flexing the specific anatomy, supernatural powers, or mechanical might of the chosen visual subject archetype before pivoting to the mundane punchline.
  3. **Overly Dramatic Warnings & Ultimatums:** Drawing an unbreakable line in the sand, issuing a dire prophecy, or laying down a fierce boundary.
  4. **Absurdly Intense Status Updates or Oaths:** Swearing a solemn blood oath, declaring current feral energy levels, or announcing an urgent personal crusade.
  5. **Classic Biker Bark Commands:** Direct, high-decibel pack rally cries that avoid overused `"LISTEN UP"` / `"OUT OF THE WAY"` clichés.
- **Export `PHASE2_TOPIC_BUCKETS` (20+ Diverse Domestic & Wholesome Sub-Themes):**
  Expand from 4 static strings to 20+ distinct thematic angles across:
  - Kitchen & appliance Diplomacy
  - Grocery store & coupon triumph
  - Sleep hygiene & bedtime coziness
  - Hydration, fiber & digestive peace
  - Stretching, joints & ergonomic care
  - Pet devotion & animal baby-talk
  - Lawn, plant & garden pride
  - Thermostat, draft & utility bill vigilance
  - Tupperware, leftovers & meal prep
  - Laundry, fresh sheets & fabric care
  - Polite driving, zipper-merging & parking lot courtesy
  - Punctuality, calendar reminders & early arrival
  - Cozy hobbies, puzzles, birdwatching & crafts
  - Weather radar tracking & umbrella preparedness
  - Hardware store browsing & tool organization
  - Unconditional emotional check-ins & complimenting the homies
  - Dental, skincare & SPF diligence
  - Quiet evenings, herbal tea & reading time
  - Tech support patience & password hygiene
  - Sofa blanket fort & Sunday nap protection

### 2. `src/services/firestoreService.ts`, `firebase-blueprint.json`, & `firestore.rules`
- **Add Persistent Caption History (`CaptionHistoryRecord`):**
  - Store the last 12 generated captions (`timestamp`, `phase1Hook`, `phase2Resolution`, `hookStyleId`, `topicBucketId`) in Firestore collection `pack_caption_history` (with automatic `.pack-server-store.json` local fallback).
  - Implement `loadRecentCaptions(limitCount = 12)` and `recordCaptionHistory(record)`.
  - Update `firebase-blueprint.json` and `firestore.rules` to include `/pack_caption_history/{captionId}` validation.

### 3. `server.ts`
- **Update Hook & Topic Selection (`pickHookStyle()` & `pickTopicCategory()`):**
  - Filter out the recently used `hookStyleId` and `topicBucketId` values from the last several runs so back-to-back memes are guaranteed to use different rhetorical structures and domestic themes.
- **Inject Anti-Repeat History into `planPackMeme()`:**
  - Load the last 12 captions via `loadRecentCaptions(12)` prior to calling `gemini-3-flash-preview`.
  - Pass the chosen `hookStyle` directive, `topicBucket` directive, and a `RECENT CAPTIONS TO STRICTLY AVOID` list into the `planPackMeme()` user prompt, explicitly forbidding the model from reusing any opening two-word phrases (including `"LISTEN UP"`, `"OUT OF THE WAY"`, `"STEP ASIDE"`) or any punchline nouns from the recent history list.
- **Record New Captions After Planning:**
  - Persist each newly planned `phase1Hook`, `phase2Resolution`, `hookStyleId`, and `topicBucketId` via `recordCaptionHistory()`.

---

## Blast Radius & Anti-Drift Constraints
- **ZERO UI REDESIGN:** Do not touch `src/App.tsx`, `src/components/`, or any CSS/Tailwind markup.
- **PRESERVE VISUAL PIPELINE:** Keep all 13 static `SUBJECT_ARCHETYPES`, the 1,250 combinatorial `WILDCARD_ADJECTIVES` × `WILDCARD_NOUNS` logic, `ATMOSPHERIC_ASSETS`, WordArt typography prompts, and `evaluatePackStyle()` untouched.
- **PRESERVE SCHEDULING & EMAIL DISPATCH:** Keep all autonomous cron scheduling and Gmail dispatch paths intact.

---

## Verification Checklist
- [ ] `THE_PACK_ENGINE_SYSTEM_INSTRUCTION` no longer anchors the model on `"LISTEN UP MFERS"` or `"STEP ASIDE BROTHER"`.
- [ ] `planPackMeme()` rotates across all 5 Phase 1 hook styles and 20+ Phase 2 topic buckets while excluding recent bucket IDs.
- [ ] Recent captions are persisted to Firestore (`pack_caption_history`) with local fallback and injected as negative constraints on subsequent runs.
- [ ] Project compiles and lints cleanly with zero UI modifications.
