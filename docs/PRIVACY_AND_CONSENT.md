# Privacy and consent (v0.1.0). This is a draft for your school's data protection review, not legal advice.

- Voice is **off** by default. It needs (1) the teacher's class switch AND (2) a parent or guardian's tick in the app's grown-ups area (behind an arithmetic gate, which a determined child can pass; a signed paper or school-system consent is stronger).
- **No audio and no transcript is stored.** A recording goes to the Worker, is sent to the speech service (Workers AI, Azure or Google, whichever is set up) and is discarded. Only the score, the item and the time are kept (`speech_attempts`, `speech_best`). Test `no audio and no transcript is stored anywhere` checks the table columns.
- Browser speech recognition (fallback) runs on the device; the Worker receives only recognised text, which is judged and discarded.
- Teacher recordings (Admin > Audio) are kept in D1; they are the teacher's voice, never pupils'.
- Pupils sign in with class code and a first name or nickname. No email, no photo.
- **Removing a pupil** (teacher page) deletes `students`, `zh_prof`, `zh_state`, `zh_log`, `speech_best`, `speech_attempts`. Tested.
- Speech services are third parties: check each one's terms (data retention, region) before switching voice on. NOT reviewed here.
- Browser-recognition scores can be faked by a pupil (the text comes from the device). Treat XP from that path as a game score, not an assessment.
