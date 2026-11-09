# UI notes, v0.7.0

## What the handoff asked for, and what was done
| # | Item | Status |
| --- | --- | --- |
| 1 | Observe children | Done by the teacher before this build. **The observations were not shared with the build, so every decision below is from the handoff and from the screens, not from your notes.** Please send what you saw; it decides v0.8. |
| 2 | Audio first | Done with browser voice (recorded audio for the top 200 words is **not** done: it was ruled out earlier, "browser TTS is sufficient"). |
| 3 | Picture login | Done, optional per class (default is typed name). |
| 4 | Report flow | Done (pupil side + teacher list). Corrections still go into `gloss/defs*.txt` by hand. |
| 5 | Word card fixes | Done (all six points). |
| 6 | Radical finder | Done. |
| 7 | Answer screen | Done: feedback sheet, 📖 icon button beside 🔊. |
| 8 | Visible progress | Done: unit map, lantern week, stickers. No leaderboard. |
| 9 | Teacher tools | Done: preview, usage, words met. |
| Smaller | Cache busting, reduced motion, contrast, UIPY rule, spoken feedback | All done and tested. |

## Design
Night Market stays (a stated requirement). The memorable thing is the lantern: the progress string in a session, the week of lanterns on the home screen. Everything else is quiet. Pupil text is in system CJK fonts only; no third-party hosts.
Tokens: night `#1b1740`, paper `#fff6e0`, lantern red `#c7352f`, gold `#ffc857`, jade `#1d7a6f`, secondary text `#574777`, pinyin on night `#ffd98a`.

## Layout rules (keep these)
- Every question = top bar, task, picture, answers. The 🔊 repeat button is always top-right of the task. After an answer, answers are replaced by the sheet; 🔊 and 📖 are always on the right of the word; Next is always the widest and reddest control.
- Every `#app` button is at least 75 x 75 px (tested at 360x640, 390x844, 820x1180, 1024x768, 1280x720). Exceptions: the radical finder and word card also use 75 px; teacher pages use 44 px.
- Only one scrolling area per screen (finder), and the question screens never scroll.
- Any new Chinese label needs a pinyin entry in `zh-ui.js` (the tests scan app.js, radicals.js and zh-meaning.js).

## Contrast (WCAG AA needs 4.5:1), measured
`#574777` on paper 7.6 · on soft purple 6.3 · pinyin `#ffd98a` on night 12.5 · helper text `#e9defa` on night 13.1 · white on lantern 5.3 · ink on gold 9.8 · white on jade 5.2.
The handoff worried about `#6b5a8a` on `#fff6e0`: it measured 5.6, so it already passed. It was replaced by `#574777` for a safer margin. The weak pair was the old pinyin colour on the dark background.

## Not verified
- Real children (see item 1). Real Chinese voices: the tests use a pretend voice. Real iPad Safari. Speaking practice with a live engine (unchanged since v0.6).
- Younger-learner screens were checked for layout, not for whether a 6 year old understands the task audio.

## v0.8 additions
- Tier A screens reuse the v0.7 layout: task bar with 🔊, hero, answers, sheet. Meet: giant emoji, characters, pinyin, English, one big Next. Tap: three picture buttons (min 110px tall, emoji 56-96px). The sheet hides the 📖 button at Tier A.
- Unit picker: a 75px row on the home card opens a full-screen list (newest unit first). At heights under 700px the unit map shrinks to 32px stops to keep Play on screen (tested at 360x640).
