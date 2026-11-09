# Speak Mandarin 讲华语 (jiǎng huáyǔ), v0.7.0 (repo name: Mandarin Say It!)

A browser app for Singapore primary pupils learning Chinese as a second language (built first for **Tier C: P5-P6 Foundation Chinese**).
Pupils can sign in, make their own account with just the class code (if the teacher allows it), or play as a guest and join a class later.
Four strands: identify words, parts of characters, how words are put together, and Say it! (reading aloud).
It is a **separate app** (its own Worker and D1 database), built from the engineering of Spell Academy v4.6.0.

**Read `docs/HANDOFF_Chinese_v0.2.0.md` first: it lists what is NOT validated.** Tones are not scored in this version.

## First-time setup (browser only, no command line)

1. **GitHub:** create a new repository and upload the contents of this folder (so `wrangler.toml` is at the top).
2. **Cloudflare dashboard > Storage & Databases > D1 > Create database**, name it `mandarin-say-it`. Copy its ID into `wrangler.toml` (`database_id`) on GitHub.
3. Open the new database > **Console**. Paste the whole of `schema.sql` and run it. **Do this before deploying.**
4. **Workers & Pages > Create > Import a repository** and pick your repo. Deploy.
5. Worker > **Settings > Variables and Secrets**: add secrets `SECRET` (any long random text) and `ADMIN_KEY` (your admin password).
6. Worker > **Settings > Bindings**: confirm `DB` (D1) and `AI` (Workers AI) are present (they come from `wrangler.toml`).
7. Optional, for better speech checking: add secret `AZURE_SPEECH_KEY` (region is `southeastasia` in `wrangler.toml`) or `GOOGLE_STT_KEY`. Without them voice uses Workers AI Whisper, which hears syllables but not tones.
8. Open `/admin.html`, type the admin key, make a teacher account. Open `/teacher.html`, sign in, create a class. Give pupils the class code and **first names or nicknames only**.

## Defaults (per class, in /teacher.html)
Pupil sign-up with the class code **off for new classes** (switch it on, or add pupils in bulk). Chinese room **on**. Voice practice **off**. Pinyin: **tap to show** (Tier C). Unit cap: 12 for new classes (existing classes keep their saved cap, default 6, until the teacher raises it). Voice also needs a parent tick in the app's grown-ups area.

## Upgrading later
**v0.6.0 to v0.7.0: ONE MIGRATION, run it first.** In the D1 Console run `migrations/002_v07.sql` (adds two columns to `students` and three tables), THEN upload the files and deploy. Old v0.6 code ignores the new columns, so running it early is safe. Running it twice fails with "duplicate column": that means it is already done. A brand-new database just runs `schema.sql`.

Run only the numbered files in `migrations/` that a release note lists, in the D1 Console, **before** deploying. **Never overwrite your `wrangler.toml`** (it holds your real D1 id).
- **v0.3.0 to v0.4.0: NO migration.** Upload the new files and deploy. Existing classes stay at their saved unit cap; open /teacher.html and raise it to reach Units 7-9. New classes start at 9.
- **v0.2.0 to v0.3.0: NO migration.** Just upload the new files and deploy. Existing classes keep their old behaviour (pupils could already be created by typing a name); that is now the sign-up switch, shown **on**. New classes start with it **off**.
- **v0.1.0 to v0.2.0: NO migration.** Just upload the new files and deploy. Pupil progress is kept.
- A brand-new database: run `schema.sql` (it already includes 002).

## Pages
`/` pupils (with links to Teacher and Admin at the bottom of the sign-in screen) · `/teacher.html` class settings, sign-up switch, sign-in style, preview as a pupil, picture cards, bulk add, pupils with usage, meaning reports, sound check, remove-pupil · `/radicals.html` radical finder (linked from the teacher page) · `/admin.html` teacher accounts and audio recording.

## Joining, bulk add and guests (v0.3.0)
- **Sign in** only works for a pupil who already exists. An unknown name gets a hint, not a new account (this stops a typo from making a duplicate pupil).
- **New here?** Pupil enters the class code (checked at once), then picks a name. Works only while the class's sign-up switch is on. A name already used in the class (any capitals) is refused.
- **Bulk add** (teacher page > class > Add pupils in bulk): paste names, one per line (commas, semicolons, tabs also split). Duplicates and names already in the class are skipped. Up to 300 at a time.
- **Guest:** one tap, no name. A guest is a normal pupil row under the reserved class `_GUEST`: teachers cannot see them, voice practice is off, and guests untouched for 30 days are deleted automatically (when the next guest is made). **Join my class** asks for the class code, then a name, and turns the same account into a class pupil, so stars and progress are kept. It follows the class's sign-up switch. The guest's sign-in lives in that device's browser storage; signing out loses it.

## Files
`public/zh-data.js` content bank · `public/zh-engine.js` mastery, session composer, activities, the Mandarin judge · `src/speech.js` engines, XP rule · `src/worker.js` routes · `tests/` (see build-tools zip).
**Cache busting:** after ANY change in `public/`, run `node build/stamp.mjs` (in the build-tools zip). It writes a content-hash import map into index, radicals and teacher pages. `node tests/content.test.mjs` fails if it is out of date.

## v0.7.0: a new pupil interface, audio first, picture login (needs migration 002)
Built after pupils tried v0.6 and the screens felt rough. Detail and decisions in `docs/UI_NOTES_v0.7.md`.
- **One layout for every question**: lantern string for progress, a task line (Chinese with pinyin, English small, hidden in young mode), a big 🔊 always top-right, the picture, the answers. After an answer the answers are replaced by a **feedback sheet**: ✓ or try again, the word with pinyin, 🔊 and 📖 (meaning) in one corner, and Next as the biggest control.
- **Audio first**: the task is spoken when the item appears (browser voice, a stated decision: no recordings), the word is spoken on reveal, with 好棒! or 再试一次。 The 🔊 repeats even when muted. A device with no Chinese voice shows a message in the grown-ups area and the teacher page, never to the child.
- **Home**: unit map (15 stops), a lantern for each of the last 7 days, words met, big Play.
- **Picture login** (teacher chooses per class): tap your picture, then three pictures. Teacher can print cards and reset a pupil's pictures. 5 wrong tries lock that pupil for 10 minutes. See `docs/PRIVACY_AND_CONSENT.md` for the trade-off.
- **Radical finder, redone**: characters I know first, parts sorted newest unit first, word counts on tiles, one screen at a time, one scroll area, stickers when every character of a part is mastered.
- **Word card**: focus trap, restored focus, page locked, remembered pinyin/English choice, lazy-loaded meanings, **Report this meaning** (fixed reasons, no typing).
- **Teacher**: Preview as a pupil, usage columns (words met, meaning taps, finder opens, seconds per item), meaning reports list, picture cards, sound check, finder link.
- **Cache busting** by content hash (`build/stamp.mjs`). Contrast, reduced motion and 75 px targets are tested.
- Tests: `bash fresh.sh` then `python3 tests/ui.py` (long: run it with `nohup` and poll), `ui_finder.py`, `ui_v07.py`; restart the server before `ui_join.py` and `ui_say.py`. Node: `content`, `engine`, `worker`, `v07`.

## v0.6.0: Units 13-15, radical finder, word meanings, younger learners
- 15 units, 1318 words, 305 characters. Every character a pupil knows now appears in at least one word (呢 is the one exception). 10 parts that had no words are now standalone characters with words. Unit 5 expanded.
- **Radical finder 部首查找**: a button on the pupil home screen (limited to the pupil's unit) and `/radicals.html` for teachers (`?unit=N&pinyin=on|tap`). Search by radical, by a character, by pinyin or by English; tap a character chip to filter; tap a word for its meaning.
- **Word meanings 意思**: every word has a simple Chinese definition (`public/zh-gloss.js`, built by `build/make_gloss.py`). Appears after an answer and in the finder. Pinyin and English are hidden until tapped.
- **Younger learners (ages 6-9)**: teacher setting per class, device override under the grown-ups screen. Shorter sessions (7 steps, 420 s), shorter sentences, no type/DDE/redup/strokes activities, 3 options instead of 4, bigger buttons and emoji. Pinyin stays "on tap" by default.
- Definitions are script-checked (one pinyin syllable per character, readings spot-checked) but NOT teacher-reviewed. No migration.
## v0.5.0: more radicals and words (Units 10-12)
- Unit 10 Home and school 家居学校, Unit 11 Animals and body 动物身体, Unit 12 Actions, feelings and talk 动作心情.
- Bank now: 192 parts (24 radical forms; new ones 尸 冫 刂 牜 阝 彳 礻), 224 decomposable characters, 222 whole characters, 626 words, 96 sentences. New items include 不 and 一 tone changes (bú shì, yí kè), 因为/所以, and new reduplication, opposite, measure and de/di/de items.
- Stroke counts, readings and word pinyin were checked by script with 0 mismatches (`scripts/check.py`). **Not teacher-reviewed: read Units 10-12 before pupils do.**
- **No migration.** Existing classes keep their saved unit cap (default 6): raise it on /teacher.html to reach Units 7-12. New classes start at 12. Upload `public/zh-data.js`, `public/app.js`, `public/zh-ui.js`, `src/`, `docs/`, README, VERSION; **never overwrite `wrangler.toml`**.
- Regenerate content: `scripts/add_content.py` (v0.3 to v0.4) then `scripts/add_content_v05.py` (v0.4 to v0.5).

## v0.4.1: pinyin toggle
Pupils get a **拼音 Tap / On** button on the home screen: pinyin on tap (default) or always on. It is remembered on that device and starts from the class setting (default tap). If the class (or a grown-up on that device) sets pinyin to **off**, the button is not shown. App cache number is now `?v=5`. No migration; upload `public/app.js`, `public/index.html`, README, VERSION.

## v0.4.0: more content, new title, pinyin help
- Title is **Speak Mandarin / 讲华语 (jiǎng huáyǔ)** on the sign-in screen, browser tab, and teacher page.
- Content: Units 7-9 (Shopping 买东西, Places and travel, Feelings and describing), ~55 new radicals/components, ~76 new decomposable characters, ~90 whole characters, ~230 words, 33 sentences. Stroke counts, readings and word glosses were checked by script (pypinyin, hanzi-writer-data) with 0 mismatches. **Not reviewed by a teacher yet: please read the new items before pupils do.**
- Pinyin: `public/zh-ui.js` holds a table (`UIPY`) that puts ruby pinyin over the app's own Chinese labels only. Lesson content still follows the class setting (tap / on / off). After each answer a line shows the word with pinyin; it is hidden when the class pinyin is **off**.
- Session composer now guarantees some grammar variety and a reduplication item once those are unlocked (behaviour change).
- To regenerate or extend content: `scripts/add_content.py` and `scripts/check.py` (build-tools zip).
