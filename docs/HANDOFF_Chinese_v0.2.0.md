# Handoff: Mandarin Say It! v0.2.0 (Tier C)

## Most important
1. **v0.1.0 showed wrong pinyin for neutral-tone words** (妈妈 appeared as māmā, 爸爸 bàbà, 饺子 jiǎozǐ) and the "choose the pinyin" question used the wrong form as its right answer. **Fixed in v0.2.** Words and sentences now use phrase-level pinyin (māma, bàba, jiǎozi, xuésheng, yì běn shū). Also fixed: 一杯水 was the only accepted answer but 一碗水 is also correct; water now accepts both. If any pupil used v0.1, they saw the old forms. If you have shown v0.1 to anyone, tell them.
2. **Tones are still NOT scored.** Same as v0.1: XP means "right syllables". Azure `zh-CN` tone detail is still unverified and no live engine was called.
3. **Content is bigger but still small, and still unreviewed by a Mandarin teacher:** 67 decomposable characters (was 56), 89 whole-shape characters (was 58), 78 components, 105 words (was 48), 26 sentences (was 12), 19 measure-word items (was 14), 9 的/地/得 items (was 4), 10 opposite pairs, 11 reduplication words. Target in the brief was 300-500 items; this is still well under half of it.
4. Not verified: MOE syllabus alignment, real children, live speech engines, Safari/iPad, real D1.

## New in v0.2
- **Unit 6 "Talk and study 说话学习":** 8 new components, 11 characters (吧 呢 吵 汗 洗 清 椅 说 读 语 话), 31 whole characters, about 55 new words, 15 sentences, 5 measure words (把 盏 支 双 件), 5 的/地/得 items. Units 1-5 only grew by words and sentences that use characters already taught there.
- **Four new activities:** stroke count (derived from the strokes of the parts; checked against 20 known counts), sort by part (tap every character with the part), reduplication (what pattern is this word? / make AA, A一A, AABB), opposites 反义词 (10 pairs, each character in exactly one pair so there is one right answer).
- **Compound type 补充 (verb + result):** 吃饱, 洗好, 写好, 做好. Type questions now show the right label plus 3 others.
- Teacher page: unit cap and per-pupil unit now go to 6. Class unit cap default is now 6.
- `docs/PILOT_PROTOCOL.md` (draft, not run).

## Tests (all passing)
content 31 · engine 30 · worker 30 · UI 692 checks across phone, tablet and laptop (all 13 activity types answered end to end, no scroll, 75 px targets, no third-party requests) · Say it! UI 11. New checks: one syllable per character, doubled kin words and repeated verbs have a neutral second syllable, 一 sandhi rule (yí before 4th tone, yì before 1st-3rd), A一A has a light 一, the old wrong pinyin never appears, stroke counts, every opposite character in one pair, reduplication forms rebuild the words, valid alternative measure words are never marked wrong.

## Migrations
**None** for v0.1.0 to v0.2.0. Existing pupil progress keeps working: new items were added at the END of the sentence, de/di/de and measure lists, so saved keys still point at the same items.

## Decisions I made without asking (reverse any)
- Opposites live under a new progress kind `o` (key like 大小). No schema change, since `zh_state.kind` is plain text.
- Reduplication covers AA, A一A and AABB only. ABAB is left out (needs more known verbs).
- Valid alternatives I chose to accept: 椅子 把 or 张; 鞋 双 or 只; 狗 只 or 条; 水 杯 or 碗. Other regional uses (e.g. 一位老师) are not in the answer set, so those measure words are not offered as options. Please check these.
- 话 (讠 + 舌) is taught as "both parts carry meaning", so no sound clue. 吵 (口 + 少) and 洗 (氵 + 先) show sound clues that are only partly right, which is the point of the lesson.
- 一 is shown as yì/yí following the usual pinyin-book rule; 你好 stays nǐ hǎo (no sandhi written).
- 画 and 话 are different characters (huà); both are in the bank.

## Known gaps
- Tier A and B; stroke order animation; syllable and tone recordings; prompt recordings; synonyms (近义词); ABAB reduplication; 把/被; Azure tone check; Safari/iPad test; browser speech-recognition fallback not browser-tested; XP bands uncalibrated; sentence items accept only the orders I enumerated.
- Polyphonic characters have one reading in the bank. 得 and 地 are only taught as de; 乐 only as lè (so 音乐 would be wrong).
- Unit 5 is small (4 characters); its progress gate is 70% of those 4.

## Checklist for you
- [ ] A Mandarin teacher reviews pinyin (especially the neutral tones and 一 changes), measure words, compound labels, opposites and every sentence order.
- [ ] Decide whether to tell anyone who saw v0.1 about the pinyin error.
- [ ] Live speech test with a key; read Azure's JSON for tone fields before any tone claim.
- [ ] Pilot (docs/PILOT_PROTOCOL.md), then calibrate the XP bands and accent allowances.
- [ ] iPad Safari and Android test.
- [ ] Data protection review (docs/PRIVACY_AND_CONSENT.md).
- [ ] Record the teacher clips (docs/RECORDING_CHECKLIST.md, regenerated for v0.2).
