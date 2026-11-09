// Picture login (v0.7): a pupil taps their own picture, then three pictures in order. Shared by the Worker and the app.
// Security note: 9 pictures x 3 taps = 729 codes. That is weak on purpose (ages 6 to 9, vocabulary progress only). See docs/PRIVACY_AND_CONSENT.md.
export const AVATARS=['🐶','🐱','🐰','🐼','🦊','🐸','🐯','🐵','🦁','🐷','🐢','🦄','🐘','🐧','🐙','🦉','🐳','🦋','🐝','🐞','🦀','🐴','🐮','🐨'];
export const PICS=['🍎','🚗','⭐','🌈','🐟','🎈','🌸','⚽','🍌'];
export const PIC_LEN=3;
export const picValid=a=>Array.isArray(a)&&a.length===PIC_LEN&&a.every(i=>Number.isInteger(i)&&i>=0&&i<PICS.length);
export const picKey=a=>a.join(',');
export const randomPic=rnd=>Array.from({length:PIC_LEN},()=>Math.floor(rnd()*PICS.length));
export default {AVATARS,PICS,PIC_LEN,picValid,picKey,randomPic};
