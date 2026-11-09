// Speech engines, the XP rule and the per-class switches. Mandarin version of the English src/sayit.js.
import {judge} from '../public/zh-engine.js';
import {UNITS} from '../public/zh-data.js';
export const MAXU=UNITS.length-1; // highest unit in the content bank

// ---- XP rule (change here). Same shape as English Say It!, but UNCALIBRATED for Mandarin: tune with real pupil recordings. ----
export const SAY_CAP=10;          // the most XP a pupil can ever earn from one spoken item
export const SAY_DAILY=60;        // voice submissions per pupil per rolling 24 hours (limits engine cost)
export const SAY_GAP=2;           // seconds between submissions from one pupil
export const SAY_MAXBYTES=400000; // 3 s of 16 kHz mono 16-bit WAV is about 96 KB
// Accuracy band -> XP for ONE recording. The pupil is paid only the difference versus what they have already earned on the item.
// IMPORTANT: accuracy here measures SYLLABLES. Tones are not scored by any engine this version uses (see HANDOFF).
export const sayTier=acc=>acc>=90?10:acc>=80?8:acc>=65?6:acc>=50?4:acc>=25?2:0;

// ---- Per-class switches (classes.settings.zh). on: the whole app. voice: recordings may be sent to a scoring service. pinyin: 'tap' | 'on' | 'off'. unitCap: highest unit this class may reach. ----
export const zhCfg=set=>{const z=(set&&set.zh)||{},on=z.on!==false;return{on,voice:on&&z.voice===true,tier:['A','B','C'].includes(z.tier)?z.tier:z.young===true?'B':'C',young:(['A','B','C'].includes(z.tier)?z.tier!=='C':z.young===true),login:z.login==='picture'?'picture':'name',pinyin:['tap','on','off'].includes(z.pinyin)?z.pinyin:'tap',unitCap:Math.min(MAXU,Math.max(1,z.unitCap|0||6))}};

// ---- Engines ----
const ORDER=['azure','google','whisper'];
export const engines=env=>ORDER.filter(e=>e==='azure'?env.AZURE_SPEECH_KEY&&env.AZURE_REGION:e==='google'?env.GOOGLE_STT_KEY:env.AI);
export async function runEngine(name,audio,text,env){return {azure,google,whisper}[name](audio,text,env)}
const b64=buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};

// Azure: zh-CN is listed as supported for Pronunciation Assessment. Whether it returns usable TONE scores is NOT verified: we use its accuracy score only as a cap on the syllable judge.
async function azure(audio,text,env){
 const cfg=btoa(JSON.stringify({ReferenceText:text,GradingSystem:'HundredMark',Granularity:'Phoneme',Dimension:'Comprehensive',PhonemeAlphabet:'SAPI',EnableMiscue:true}));
 const r=await fetch(`https://${env.AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${env.SPEECH_LANG||'zh-CN'}&format=detailed`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':env.AZURE_SPEECH_KEY,'Content-Type':'audio/wav; codecs=audio/pcm; samplerate=16000','Pronunciation-Assessment':cfg,Accept:'application/json'},body:audio});
 if(!r.ok)throw new Error('azure '+r.status);
 const nb=(await r.json()).NBest?.[0];if(!nb)return{alts:[],cap:0};
 return{alts:[nb.Display||nb.Lexical||''],cap:Math.round(nb.PronunciationAssessment?.AccuracyScore??100)}}
async function google(audio,text,env){
 const r=await fetch('https://speech.googleapis.com/v1/speech:recognize?key='+env.GOOGLE_STT_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({config:{encoding:'LINEAR16',sampleRateHertz:16000,languageCode:env.GOOGLE_LANG||'cmn-Hans-CN',maxAlternatives:5},audio:{content:b64(audio)}})});
 if(!r.ok)throw new Error('google '+r.status);
 return{alts:((await r.json()).results?.[0]?.alternatives||[]).map(a=>a.transcript||''),cap:100}}
// Whisper often returns Traditional characters or "corrects" toward real words; the initial prompt asks for Simplified Mandarin. Heard text is judged on syllables only.
async function whisper(audio,text,env){
 const out=await env.AI.run('@cf/openai/whisper-large-v3-turbo',{audio:b64(audio),language:'zh',initial_prompt:'以下是普通话的句子，使用简体中文。'});
 return{alts:[out.text||''],cap:100}}

// Judge a recording: text engines return characters; the Mandarin judge compares syllables. Azure's own accuracy can only lower the result.
export function score(target,res){const j=judge(target,res.alts);if(j.result==='again')return j;
 const acc=Math.min(j.acc,res.cap);return{...j,acc,result:acc>=85?'correct':acc>=50?'near':'try'}}
// Browser speech recognition runs on the pupil's device; only the recognised text reaches the Worker. It is NOT trustworthy against a cheating pupil.
export const scoreHeard=(target,alts)=>score(target,{alts:(Array.isArray(alts)?alts:[]).slice(0,5).map(x=>String((x&&x.transcript)||x||'').slice(0,60)),cap:100});
