# Mandarin Say It! 夜市 (Night Market Chinese), v0.2.0

A browser app for Singapore primary pupils learning Chinese as a second language (built first for **Tier C: P5-P6 Foundation Chinese**).
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
Chinese room **on**. Voice practice **off**. Pinyin: **tap to show** (Tier C). Unit cap: 6. Voice also needs a parent tick in the app's grown-ups area.

## Upgrading later
Run only the numbered files in `migrations/` that a release note lists, in the D1 Console, **before** deploying.
- **v0.1.0 to v0.2.0: NO migration.** Just upload the new files and deploy. Pupil progress is kept.
- A brand-new database: run `schema.sql` (same as `001_init.sql`).

## Pages
`/` pupils · `/teacher.html` class settings, pupils, remove-pupil · `/admin.html` teacher accounts and audio recording.

## Files
`public/zh-data.js` content bank · `public/zh-engine.js` mastery, session composer, activities, the Mandarin judge · `src/speech.js` engines, XP rule · `src/worker.js` routes · `tests/` (see build-tools zip).
Cache numbers: bump `?v=` in `public/index.html` whenever `app.css` or `app.js` change.
