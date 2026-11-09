// Word card: a word with its Chinese meaning (中文释义). Pinyin and English are shown on tap.
// Used after an answer (📖 button) and by the radical finder. Nothing here appears until the pupil taps.
// v0.7: focus is trapped while open and restored on close; the page behind is locked; the 100 KB meaning file loads the first time a card opens;
// the pinyin and English choices are remembered for the rest of the visit; "Report this meaning" sends a fixed reason to the teacher.
import D from './zh-data.js';
import {T} from './zh-ui.js';
import {speakParts} from './zh-speech.js';

const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(x==='class')e.className=v;else if(x.startsWith('on'))e[x]=v;else if(v!==null&&v!==undefined&&v!==false)e.setAttribute(x,v===true?'':v)}e.append(...k.flat().filter(x=>x!=null&&x!==false));return e};
const HAN=/\p{Script=Han}/u;

let ZH=null,loading=null;
export const loadGloss=()=>ZH?Promise.resolve(ZH):(loading=loading||import('./zh-gloss.js').then(m=>ZH=m.ZH));
export const meaningOf=w=>ZH&&ZH[w]?{zh:ZH[w][0],py:ZH[w][1].split(' ')}:null;
export const hasCard=w=>!!D.BYW[w];
export const REASONS=[['meaning','Wrong meaning'],['pinyin','Wrong pinyin'],['hard','Too hard to read'],['other','Something else']];

// text with punctuation; pys = one syllable per Chinese character
export function rubyText(text,pys,show){let i=0;const out=[];for(const c of text){if(HAN.test(c)){const p=pys[i++];out.push(show&&p?el('ruby',{},c,el('rt',{},p)):c)}else out.push(c)}return out}

const mem={py:null,en:null}; // what the pupil chose last, for this visit only
let openEl=null;
const FOCUSABLE='button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
export function openWordCard(word,{pinyin='tap',opener,speak,report}={}){
 const w=D.BYW[word];if(!w)return null;closeWordCard();
 let showPy=mem.py!==null?mem.py:pinyin==='on',showEn=!!mem.en,m=meaningOf(word),loaded=!!ZH;
 const wordBox=el('div',{class:'wc-word',lang:'zh'}),zhBox=el('div',{class:'wc-zh',lang:'zh'}),enBox=el('div',{class:'wc-en'}),repBox=el('div',{class:'wc-rep'});
 const pyBtn=pinyin==='off'?null:el('button',{class:'wc-btn','aria-pressed':'false'});
 const enBtn=el('button',{class:'wc-btn','aria-pressed':'false'});
 const draw=()=>{
  wordBox.replaceChildren(...rubyText(word,D.pyChars(word),showPy));
  zhBox.replaceChildren(el('div',{class:'wc-label'},...T('意思 ')),!loaded?el('div',{class:'wc-none'},'…'):m?el('div',{class:'wc-def'},...rubyText(m.zh,m.py,showPy)):el('div',{class:'wc-none'},'No Chinese meaning yet.'));
  enBox.replaceChildren(...(showEn?[el('div',{class:'wc-def wc-endef'},w.en)]:[]));
  if(pyBtn){pyBtn.replaceChildren(...T('拼音'));pyBtn.setAttribute('aria-pressed',showPy?'true':'false');pyBtn.setAttribute('aria-label',showPy?'Hide pinyin':'Show pinyin')}
  enBtn.textContent='EN';enBtn.setAttribute('aria-pressed',showEn?'true':'false');enBtn.setAttribute('aria-label',showEn?'Hide English':'Show English');
 };
 if(pyBtn)pyBtn.onclick=()=>{showPy=!showPy;mem.py=showPy;draw()};
 enBtn.onclick=()=>{showEn=!showEn;mem.en=showEn;draw()};
 const speakBtn=el('button',{class:'wc-btn','aria-label':'Listen'},'🔊');
 speakBtn.onclick=()=>{if(speak)speak(word);else speakParts([word],{rate:.8})};
 const close=el('button',{class:'wc-close','aria-label':'Close'},'✕');
 // Report: tap "Report this meaning", then one fixed reason. Nothing to type.
 const drawRep=(state)=>{if(!report){repBox.replaceChildren();return}
  if(state==='thanks')return repBox.replaceChildren(el('div',{class:'wc-thanks',role:'status'},'Thank you! Your teacher will check it.'));
  if(state==='pick')return repBox.replaceChildren(el('div',{class:'wc-label'},'What is wrong?'),el('div',{class:'wc-reasons'},REASONS.map(([k,t])=>el('button',{class:'wc-reason',onclick:async()=>{drawRep('thanks');try{await report(word,k)}catch{}}},t))));
  repBox.replaceChildren(el('button',{class:'wc-link',onclick:()=>{drawRep('pick');repBox.querySelector('button').focus()}},'⚑ Report this meaning'))};
 const card=el('div',{class:'wc-card',role:'dialog','aria-modal':'true','aria-label':'Word meaning',tabindex:'-1'},
  el('div',{class:'wc-head'},w.emo?el('span',{class:'wc-emo','aria-hidden':'true'},w.emo):null,wordBox,el('div',{class:'wc-sp'}),close),
  zhBox,enBox,el('div',{class:'wc-row'},pyBtn,enBtn,speakBtn),repBox);
 const back=el('div',{class:'wc-back'},card);
 // lock the page behind and make it unreachable
 const root=document.documentElement,prevOverflow=root.style.overflow;root.style.overflow='hidden';
 const inerted=[...document.body.children].filter(c=>c!==back);inerted.forEach(c=>{c.inert=true});
 const shut=()=>{if(openEl!==back)return;back.remove();openEl=null;document.removeEventListener('keydown',key,true);root.style.overflow=prevOverflow;inerted.forEach(c=>{c.inert=false});try{opener&&opener.isConnected&&opener.focus()}catch{}};
 // Escape closes; Tab and Shift+Tab stay inside the card (for browsers without inert)
 const key=e=>{if(e.key==='Escape'){e.preventDefault();shut();return}
  if(e.key!=='Tab')return;const f=[...card.querySelectorAll(FOCUSABLE)].filter(x=>x.offsetParent!==null);if(!f.length){e.preventDefault();return}
  const first=f[0],last=f[f.length-1],a=document.activeElement;
  if(e.shiftKey&&(a===first||!card.contains(a))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(a===last||!card.contains(a))){e.preventDefault();first.focus()}};
 close.onclick=shut;back.onclick=e=>{if(e.target===back)shut()};document.addEventListener('keydown',key,true);
 draw();drawRep();document.body.append(back);openEl=back;close.focus();back._shut=shut;
 if(!loaded)loadGloss().then(()=>{if(openEl!==back)return;loaded=true;m=meaningOf(word);draw()}).catch(()=>{if(openEl!==back)return;loaded=true;draw()});
 return shut}
export function closeWordCard(){if(openEl&&openEl._shut)openEl._shut()}

const CSS=`.wc-back{position:fixed;inset:0;background:#000b;display:flex;align-items:flex-end;justify-content:center;z-index:50;overscroll-behavior:contain}
.wc-card{background:#fff6e0;color:#2b2140;width:min(760px,100%);max-height:82vh;max-height:82dvh;overflow:auto;overscroll-behavior:contain;border-radius:28px 28px 0 0;border-top:8px solid #ffc857;padding:16px 18px max(16px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;font:18px/1.4 "PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
.wc-card:focus{outline:none}
.wc-card button{font:inherit;border:0;cursor:pointer;border-radius:20px;touch-action:manipulation}.wc-card button:focus-visible{outline:4px solid #2b2140;outline-offset:2px}
.wc-head{display:flex;align-items:center;gap:12px}.wc-sp{flex:1}.wc-emo{font-size:48px}.wc-word{font-size:clamp(40px,9vmin,64px);font-family:"Kaiti SC","STKaiti","KaiTi",serif;line-height:1.7}
.wc-label{font-size:15px;color:#574777}.wc-def{font-size:clamp(22px,4.6vmin,30px);line-height:1.9}.wc-endef{font-family:system-ui,sans-serif;line-height:1.4}.wc-none{color:#574777}
.wc-row{display:flex;gap:10px;flex-wrap:wrap}.wc-btn,.wc-close,.wc-reason{background:#e9defa;color:#2b2140;min-height:75px;min-width:75px;font-size:22px;padding:6px 16px;box-shadow:0 3px 0 #0003}.wc-btn[aria-pressed="true"]{background:#ffc857}
.wc-link{background:none;color:#574777;min-height:75px;text-decoration:underline;font-size:17px;padding:0 8px}
.wc-reasons{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wc-reason{font-size:18px}.wc-thanks{font-size:18px;padding:18px 0;color:#1d7a6f;font-weight:700}
.wc-card rt{font-size:max(.5em,12px);color:#574777;font-weight:400}body.young .wc-card rt{font-size:max(.6em,13px)}
@media (prefers-reduced-motion:no-preference){.wc-card{animation:wcrise .2s ease-out}@keyframes wcrise{from{transform:translateY(20px);opacity:0}}}`;
if(typeof document!=='undefined'&&!document.getElementById('wc-css')){const s=document.createElement('style');s.id='wc-css';s.textContent=CSS;document.head.append(s)}
