// Browser speech for the pupil app (v0.7). Browser voices only (a stated decision), no recordings.
// Task phrases are spoken automatically when an item appears, so a pupil who cannot read the prompt can still play.
// If the device has no Chinese voice the browser may stay silent without any error, so we look for one and tell the TEACHER, not the child.
const ok=()=>typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined';
export const speechSupported=ok;
const isZh=v=>/^(zh|cmn|yue)/i.test(v.lang||'')||/chinese|mandarin|普通话|中文/i.test(v.name||'');
let voice=null;
const pick=()=>{if(!ok())return null;const vs=speechSynthesis.getVoices();voice=vs.find(v=>/^zh[-_]CN/i.test(v.lang))||vs.find(isZh)||null;return voice};
// Resolves to {supported, found, name, count}. Voices load late in some browsers, so wait briefly for them.
export function checkVoice(wait=1500){return new Promise(res=>{if(!ok())return res({supported:false,found:false,name:'',count:0});
 const done=()=>{const v=pick();res({supported:true,found:!!v,name:v?v.name:'',count:speechSynthesis.getVoices().length})};
 if(speechSynthesis.getVoices().length)return done();let fin=false;const go=()=>{if(fin)return;fin=true;done()};
 speechSynthesis.addEventListener&&speechSynthesis.addEventListener('voiceschanged',go,{once:true});setTimeout(go,wait)})}
export function cancelSpeech(){try{ok()&&speechSynthesis.cancel()}catch{}}
// Say several short pieces one after another, replacing anything already being said.
export function speakParts(parts,{rate=.85,onend}={}){if(!ok()){onend&&onend();return}try{speechSynthesis.cancel();if(!voice)pick();const list=parts.filter(Boolean);if(!list.length){onend&&onend();return}
 list.forEach((p,i)=>{const u=new SpeechSynthesisUtterance(String(p));u.lang='zh-CN';if(voice)u.voice=voice;u.rate=rate;if(onend&&i===list.length-1)u.onend=()=>onend();speechSynthesis.speak(u)})}catch{onend&&onend()}}
// What is said for each kind of feedback (kept short; the sheet also shows it)
export const PRAISE='好棒!',AGAIN='再试一次。';
// Spoken form of each task, by activity. The screen shows the same words with pinyin (see app.js).
export const TASK={py:'哪个拼音对?',hear:'听一听,是哪个词?',emoji:'这是什么?',odd:'哪一个不一样?',build:'把字拼起来。',part:'哪一部分表示意思?',type:'这个词怎么组成?',measure:'选量词。',dde:'选一个。',order:'把词语排好。',strokes:'一共几画?',opp:'反义词是哪个?',pattern:'这个词是什么重叠?',make:'选一个。',say:'大声读。'};
export default {speechSupported,checkVoice,cancelSpeech,speakParts,TASK,PRAISE,AGAIN};
