# Privacy and consent (updated for v0.7.0). This is a draft for your school's data protection review, not legal advice.

- Voice is **off** by default. It needs (1) the teacher's class switch AND (2) a parent or guardian's tick in the app's grown-ups area (behind an arithmetic gate, which a determined child can pass; a signed paper or school-system consent is stronger).
- **No audio and no transcript is stored.** A recording goes to the Worker, is sent to the speech service (Workers AI, Azure or Google, whichever is set up) and is discarded. Only the score, the item and the time are kept (`speech_attempts`, `speech_best`). Test `no audio and no transcript is stored anywhere` checks the table columns.
- Browser speech recognition (fallback) runs on the device; the Worker receives only recognised text, which is judged and discarded.
- Teacher recordings (Admin > Audio) are kept in D1; they are the teacher's voice, never pupils'.
- Pupils sign in with class code and a first name or nickname. No email, no photo.
- **Removing a pupil** (teacher page) deletes `students`, `zh_prof`, `zh_state`, `zh_log`, `speech_best`, `speech_attempts`. Tested.
- Speech services are third parties: check each one's terms (data retention, region) before switching voice on. NOT reviewed here.
- Browser-recognition scores can be faked by a pupil (the text comes from the device). Treat XP from that path as a game score, not an assessment.

## Added in v0.7.0
- **Picture login is weaker than a typed passcode on purpose.** 9 pictures, 3 taps = 729 combinations. It is acceptable only because the data is vocabulary progress and stars for ages 6 to 9, with no email, photo or voice. The code is stored **readable** (three numbers on the pupil row) so the teacher can print cards. It is never sent to the pupil app; only the teacher page can read it. Five wrong tries lock that pupil for 10 minutes. Do not use picture login for a class where one child logging in as another would matter; use the typed name.
- **The class roster is public to anyone who knows the class code, in a picture-login class**: first names (or nicknames) and an animal avatar, nothing else. Use nicknames if first names are a concern. Name-login classes show no roster.
- **Usage counts** (`zh_event`): how many times a pupil opened a meaning (with the word) or the finder, and seconds per question. No free text. Teachers see per-pupil counts for 30 days. Preview sessions are not counted. Deleted with the pupil.
- **Meaning reports** (`zh_report`): the word, one of four fixed reasons, the class, the pupil id and the time. A pupil can make 20 a day, one open report per word. The teacher page shows counts only, not who reported.
- **Removing a pupil** now also deletes `zh_event`, `zh_fail` and `zh_report` rows for that pupil. Tested.
- **Sound** uses the browser's own voice on the device. Nothing is sent to us.
- The teacher **preview** is a throwaway pupil under the reserved class `_PREVIEW_<code>`; it is reset each time and removed after a day.
