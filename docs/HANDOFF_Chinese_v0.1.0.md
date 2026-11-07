# Handoff: Mandarin Say It! v0.1.0 (Tier C first)

## Most important limitations
1. **Tones are NOT scored.** No engine in this build scores tones. Whisper returns characters (often "corrected" toward real words); Azure `zh-CN` is listed as supported for Pronunciation Assessment (certain, from the current Azure language table) but I could **not** confirm tone-level scores from the docs and never called it live (guessing it may). XP therefore means "right syllables". Parents see this in the app.
2. **No speech engine was called for real.** Whisper/Azure/Google calls are written but only tested against a mock. First live test: set a key, switch voice on for a test class, record yourself and a child.
3. **Content is small: 56 decomposable characters, 58 whole-shape characters, 48 words, 12 sentences, 14 measure-word items, 4 的/地/得 items.** The brief asked for 300-500 items; this is roughly a seventh to a tenth of that. I would rather ship checked content than a large unchecked bank.
4. **Nothing was reviewed by a Mandarin teacher or tested with children.** Curriculum alignment with the MOE Foundation Chinese syllabus is **not verified** (I did not read the syllabus; unit themes are my judgment).
5. XP bands (2/4/6/8/10 at 25/50/65/80/90) are copied from English and are **uncalibrated** for Mandarin syllables.

## What is built (certain, tested)
- Content bank with automated checks: parts exist; **gating** (a character is never in an earlier unit than its parts; no unit-N pupil is offered unit-N+1 items; tested for the composer, results route and voice route); tone marks sit on the right vowel; sentences enumerate every accepted order; measure-word items have exactly one right option (and 狗 accepts both 只 and 条); no duplicates.
- Activities (all driven end to end in Chromium on phone, tablet and laptop): picture/pinyin/hear to word, odd one out, Character Builder, which part tells the meaning, same part, compound type (并列/偏正/动宾/主谓), measure word, sentence order, 的/地/得, Say it!
- Mastery and review boxes copied unchanged from English (5 of last 6 on 2 days; 1/2/4/7 days). Sessions capped at 12 minutes; a new pupil gets about 10 steps.
- Server-side voice scoring, 10 XP lifetime cap per item paid as a difference computed inside one D1 batch, claim-then-check throttle (2 s, 60/day, row released on refusal or engine error), consent and class switches, binary WAV route before JSON parse, pupil removal wipes every table.
- "Again" result: English words, silence or unreadable engine output give no XP, **no recorded miss**, and release the slot.
- Singapore accent allowances in the judge: zh/z, ch/c, sh/s and an/ang, en/eng, in/ing get 0.85 credit (guess, calibrate). Traditional characters from Whisper are read as Simplified. A homophone list (`EXTRA`) covers common substitutes.
- UI checks: no page scroll, all child-screen buttons at least 75 px, no third-party requests, no page errors, mic denied gives a friendly message, no Say it! step without consent.

## Decisions I made without asking (reverse any)
- **Folder/zip name is `mandarin-say-it`, not `spell-academy`**, because you chose a separate app. Separate app means I **rebuilt** minimal login, classes, teacher and admin pages (the brief said reuse for a module; for a separate app there was nothing to reuse at runtime). Teacher accounts are made on /admin.html with an ADMIN_KEY, passwords PBKDF2.
- Non-voice results (`/api/zh/result`) are **reported by the browser** (as in the English reading path). A pupil could fake mastery; XP is only paid from voice scoring, so this does not affect XP.
- Pupil moves up a unit when 70% of that unit's characters are mastered (guess); teachers can set a class cap and move a pupil.
- Unit order: 1 family and people, 2 nature and time, 3 food and action, 4 animals/colours/home, 5 the 青 family. Chosen by me.
- Sound clues (声旁) are taught as clues only; never marked wrong; 5 characters (好 明 看 家 国) are marked "both parts carry meaning" so no clue is taught. These classifications are my judgment, please check them (看 is shown as 手 + 目, the usual teaching form).
- Whole-shape characters (no decomposition) include 吃 and 唱 because their parts are not in the bank.
- Visual skin: "Night Market 夜市" (indigo night, lantern red, gold, paper cards). Pinyin default: tap to show.
- Instructions are bilingual English + Chinese and read by the browser voice (no recordings yet).

## Known gaps / not done
- Tier A and Tier B; Azure tone detail; stroke-order (no data licence checked, nothing bundled); reduplication and synonym/opposite activities; "which characters share this part" is done, sort-by-radical and stroke-count tap are not; 把/被; a pilot protocol document; syllable/tone recordings and prompt recordings; Safari/iPad testing (only Chromium tested); browser SpeechRecognition fallback is written but not browser-tested; real D1 (tests use an in-memory SQLite stand-in); a Chinese font for kaishu look (system fonts only; checked that CJK renders in headless Chromium).
- Sentence items accept only the orders I enumerated; other valid orders would show "Good try", so review each sentence.

## Checklist for you
- [ ] A Mandarin teacher reviews every pinyin, gloss, sentence order, measure word and compound type label.
- [ ] Check the MOE syllabus alignment and the unit order.
- [ ] Run the live speech test with a key; try Azure `zh-CN` and read its JSON for tone fields before claiming tone scoring.
- [ ] Record 6-10 children (with consent) to calibrate bands and accent allowances.
- [ ] Test on iPad Safari and an Android phone (recording and TTS).
- [ ] Data protection review (docs/PRIVACY_AND_CONSENT.md).
- [ ] Record the teacher clips (docs/RECORDING_CHECKLIST.md).

## Tests (build-tools zip: `tests/`)
`node tests/content.test.mjs` 19 · `engine.test.mjs` 26 · `worker.test.mjs` 28 (needs Node 22) · UI: start `node tests/serve.mjs`, then `python3 tests/ui.py` (371 checks) and `python3 tests/ui_say.py` (11). A real bug found by tests: HTTP headers cannot carry Chinese, so the item is URL-encoded in `x-item`.
