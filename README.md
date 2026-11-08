# Speak Mandarin 讲华语 (jiǎng huáyǔ), v0.5.0 (repo name: Mandarin Say It!)

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
Run only the numbered files in `migrations/` that a release note lists, in the D1 Console, **before** deploying. **Never overwrite your `wrangler.toml`** (it holds your real D1 id).
- **v0.3.0 to v0.4.0: NO migration.** Upload the new files and deploy. Existing classes stay at their saved unit cap; open /teacher.html and raise it to reach Units 7-9. New classes start at 9.
- **v0.2.0 to v0.3.0: NO migration.** Just upload the new files and deploy. Existing classes keep their old behaviour (pupils could already be created by typing a name); that is now the sign-up switch, shown **on**. New classes start with it **off**.
- **v0.1.0 to v0.2.0: NO migration.** Just upload the new files and deploy. Pupil progress is kept.
- A brand-new database: run `schema.sql` (same as `001_init.sql`).

## Pages
`/` pupils (with links to Teacher and Admin at the bottom of the sign-in screen) · `/teacher.html` class settings, sign-up switch, bulk add, pupils, remove-pupil · `/admin.html` teacher accounts and audio recording.

## Joining, bulk add and guests (v0.3.0)
- **Sign in** only works for a pupil who already exists. An unknown name gets a hint, not a new account (this stops a typo from making a duplicate pupil).
- **New here?** Pupil enters the class code (checked at once), then picks a name. Works only while the class's sign-up switch is on. A name already used in the class (any capitals) is refused.
- **Bulk add** (teacher page > class > Add pupils in bulk): paste names, one per line (commas, semicolons, tabs also split). Duplicates and names already in the class are skipped. Up to 300 at a time.
- **Guest:** one tap, no name. A guest is a normal pupil row under the reserved class `_GUEST`: teachers cannot see them, voice practice is off, and guests untouched for 30 days are deleted automatically (when the next guest is made). **Join my class** asks for the class code, then a name, and turns the same account into a class pupil, so stars and progress are kept. It follows the class's sign-up switch. The guest's sign-in lives in that device's browser storage; signing out loses it.

## Files
`public/zh-data.js` content bank · `public/zh-engine.js` mastery, session composer, activities, the Mandarin judge · `src/speech.js` engines, XP rule · `src/worker.js` routes · `tests/` (see build-tools zip).
Cache numbers: bump `?v=` in `public/index.html` whenever `app.css` or `app.js` change.

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
