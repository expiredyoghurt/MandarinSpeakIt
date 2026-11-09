// Mandarin Say It! engine: shared by the browser, the Worker and the tests.
// Mastery and review rules are copied UNCHANGED from the English reading path (sayit-read.js). Everything else is new for Mandarin.
import D from './zh-data.js';
const {COMPS,CHARS,WHOLE,WORDS,SENTS,MEASURES,MEASURE_SET,DDE,TYPES,OPP,REDUP,sylls,stripTone,toned,simp,pyChars}=D;

// ---- Mastery (unchanged from English): last 6 results, 5 correct, on 2 different days. Review boxes 1/2/4/7 days. ----
export const BOXES=[1,2,4,7];
export const blank=()=>({h:[],d:[],box:0,due:0});
export function update(st,ok,day){const s=st?{h:[...st.h],d:[...st.d],box:st.box|0,due:st.due|0}:blank();
 s.h.push(ok?1:0);if(s.h.length>6)s.h.shift();if(!s.d.includes(day))s.d.push(day);if(s.d.length>20)s.d.shift();
 s.box=ok?Math.min(s.box+1,BOXES.length-1):0;s.due=day+BOXES[s.box];return s}
export const mastered=st=>!!st&&st.h.length>=6&&st.h.reduce((a,b)=>a+b,0)>=5&&new Set(st.d).size>=2;
export const level=st=>!st||!st.h.length?0:mastered(st)?2:1;
export function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- What is offered to a pupil at a given unit (the analogue of the English decodability rule) ----
export const poolChars=u=>Object.values(CHARS).filter(c=>c.u<=u);
export const poolWords=u=>WORDS.filter(w=>w.u<=u);
export const poolSents=u=>SENTS.filter(s=>s.u<=u);
export const poolMeasures=u=>MEASURES.filter(m=>m.u<=u);
export const poolOpp=u=>OPP.filter(o=>o.u<=u);
export const poolDde=u=>DDE.map((d,i)=>({...d,i})).filter(d=>d.u<=u);
export const offered=(k,key,u)=>{
 if(k==='c')return !!CHARS[key]&&CHARS[key].u<=u;if(k==='w')return !!D.BYW[key]&&D.BYW[key].u<=u;
 if(k==='s')return !!SENTS[+key]&&SENTS[+key].u<=u;if(k==='m')return MEASURES.some(m=>m.n===key&&m.u<=u);
 if(k==='d')return !!DDE[+key]&&DDE[+key].u<=u;if(k==='o')return OPP.some(o=>o.key===key&&o.u<=u);return false};

// ---- Session composer (about 12 minutes at most). states: Map 'kind:key' -> state. ----
const SECS={strokes:20,sort:35,redup:25,opp:20,pick:20,odd:25,build:40,part:25,share:25,type:25,measure:25,order:45,dde:25,say:30};
let YOUNG=false;export const setYoung=b=>{YOUNG=!!b};
const YSKIP=new Set(['type','dde','redup','strokes']);
export function makeItem(spec,unit,seed){const it=makeItem0(spec,unit,seed);if(YOUNG&&it&&Array.isArray(it.options)&&it.options.length===4&&typeof it.answer==='string'&&['pick','odd','share','part'].includes(it.t)){const i=it.options.findIndex(o=>(o.value??o)!==it.answer);if(i>=0)it.options=it.options.filter((_,j)=>j!==i)}return it}
export function compose(o){ // {unit, states, day, voice, seed, young}
 YOUNG=!!o.young;
 const rng=mulberry(o.seed|0),sh=a=>[...a].sort(()=>rng()-.5),S=o.states||new Map(),u=o.unit,steps=[];
 const lv=(k,key)=>level(S.get(k+':'+key)),due=(k,key)=>{const s=S.get(k+':'+key);return s&&s.due<=o.day&&s.h.length>0};
 const cand=[];
 for(const c of poolChars(u)){cand.push({k:'c',key:c.c});}
 for(const w of poolWords(u))cand.push({k:'w',key:w.w});
 for(const m of poolMeasures(u))cand.push({k:'m',key:m.n});
 for(const s of poolSents(u).filter(s=>!YOUNG||(s.tiles||[]).length<=4))cand.push({k:'s',key:String(s.id)});
 if(!YOUNG)for(const d of poolDde(u))cand.push({k:'d',key:String(d.i)});
 for(const o of poolOpp(u))cand.push({k:'o',key:o.key});
 const dueL=sh(cand.filter(x=>due(x.k,x.key))).slice(0,4);
 const fresh=cand.filter(x=>lv(x.k,x.key)===0&&!dueL.includes(x));
 // new items come from the newest unit first, so a pupil meets the unit's own characters before older ones
 const uOf=x=>x.k==='c'?CHARS[x.key].u:x.k==='w'?D.BYW[x.key].u:x.k==='s'?SENTS[+x.key].u:x.k==='m'?MEASURES.find(m=>m.n===x.key).u:x.k==='o'?OPP.find(o=>o.key===x.key).u:DDE[+x.key].u;
 const newL=sh(fresh).sort((a,b)=>uOf(b)-uOf(a)).slice(0,4);
 const learn=sh(cand.filter(x=>lv(x.k,x.key)===1&&!dueL.includes(x)));
 const fill=sh(cand.filter(x=>lv(x.k,x.key)===2&&!dueL.includes(x)));
 const order=[...dueL.map(x=>({...x,blk:'review'})),...newL.map(x=>({...x,blk:'new'})),...learn.slice(0,5).map(x=>({...x,blk:'practice'})),...fill.slice(0,3).map(x=>({...x,blk:'practice'}))];
 const seen=new Set();let tot=0,full=false;
 const add=(x,t)=>{if(full)return;if(tot+SECS[t]>(YOUNG?420:720)){full=true;return}tot+=SECS[t];steps.push({...x,t})};
 for(const x of order){const sig=x.k+x.key;if(seen.has(sig))continue;seen.add(sig);
  const ts=actsFor(x,rng).filter(t=>!(YOUNG&&YSKIP.has(t))&&makeItem({t,key:x.key},u,1));
  for(const t of ts.slice(0,x.blk==='new'?2:1))add(x,t)}
 // a brand-new pupil has little to review: top the session up with more unseen items so it is a real session, newest unit first
 for(const x of sh(fresh).sort((a,b)=>uOf(b)-uOf(a))){if(steps.length>=(YOUNG?7:10)||full)break;const sig=x.k+x.key;if(seen.has(sig))continue;seen.add(sig);
  const t=actsFor(x,rng).find(t=>!(YOUNG&&YSKIP.has(t))&&makeItem({t,key:x.key},u,1));if(t)add({...x,blk:'new'},t)}
 // v0.4: with big newest units, older grammar items (measure words, 的/地/得, opposites) could wait many sessions. If this session has none, add one unseen one from any unit the pupil has reached.
 if(!full&&!steps.some(x=>x.k==='m'||x.k==='d'||x.k==='o')){const g=sh(fresh.filter(x=>(YOUNG?'mo':'mdo').includes(x.k)&&!seen.has(x.k+x.key))).sort((a,b)=>uOf(b)-uOf(a)),x=g[0];
  if(x){const t=actsFor(x,rng).find(t=>!(YOUNG&&YSKIP.has(t))&&makeItem({t,key:x.key},u,1));if(t)add({...x,blk:'new'},t)}}
 // same for reduplication (AA, A一A): it rides on words, so an unseen older reduplicated word would otherwise wait behind the newest unit's words
 if(!full&&!YOUNG&&!steps.some(x=>x.t==='redup')){const g=sh(fresh.filter(x=>x.k==='w'&&REDUP.some(r=>r.w===x.key)&&!seen.has(x.k+x.key))).sort((a,b)=>uOf(b)-uOf(a)),x=g[0];
  if(x&&makeItem({t:'redup',key:x.key},u,1))add({...x,blk:'new'},'redup')}
 if(o.voice){const say=sh([...poolWords(u).filter(w=>lv('w',w.w)>=1).map(w=>({k:'w',key:w.w})),...poolSents(u).filter(s=>lv('s',s.id)>=1).map(s=>({k:'s',key:String(s.id)}))]).slice(0,3);
  for(const x of say){if(tot+SECS.say>720)break;tot+=SECS.say;steps.push({...x,blk:'say',t:'say'})}}
 return{steps,secs:tot}}
function actsFor(x,rng){const sh=a=>[...a].sort(()=>rng()-.5);
 if(x.k==='c'){const c=CHARS[x.key];return ['build',...sh(c.ph!==0?['part','share','strokes','sort']:['share','strokes','sort'])]}
 if(x.k==='w'){const w=D.BYW[x.key];return sh(['pick','odd',...(w.type?['type']:[]),...(REDUP.some(r=>r.w===x.key)?['redup']:[])])}
 if(x.k==='o')return['opp'];if(x.k==='m')return['measure'];if(x.k==='s')return['order'];if(x.k==='d')return['dde'];return[]}

// ---- Item generators: every question has an explicit, checkable answer. ----
const shuffleWith=(a,rng)=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r};
const uniq=a=>[...new Set(a)];
const TONES={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'};
function retone(syl,t){const {base}=stripTone(syl);if(t===5)return base.replace(/v/g,'ü');const b=base.replace(/v/g,'ü');
 const vs=[...b].map((c,i)=>'aeiouü'.includes(c)?i:-1).filter(i=>i>=0);if(!vs.length)return b;
 const at=b.includes('a')?b.indexOf('a'):b.includes('e')?b.indexOf('e'):b.includes('ou')?b.indexOf('o'):vs[vs.length-1];
 return b.slice(0,at)+TONES[b[at]][t-1]+b.slice(at+1)}
// split a word's pinyin by character: one syllable per character
const wordSyl=w=>pyChars(w);
function pyOptions(word,rng,pool){const sy=wordSyl(word),correct=sy.join(''),opts=new Set([correct]);
 for(let tries=0;tries<30&&opts.size<4;tries++){const i=Math.floor(rng()*sy.length),cur=stripTone(sy[i]),t=1+Math.floor(rng()*4);
  if(t===cur.tone)continue;const v=[...sy];v[i]=retone(sy[i],t);opts.add(v.join(''))}
 for(const w of shuffleWith(pool,rng)){if(opts.size>=4)break;if(w.w.length===word.length)opts.add(wordSyl(w.w).join(''))}
 return{correct,options:shuffleWith([...opts].slice(0,4),rng)}}

function makeItem0(spec,unit,seed){const rng=mulberry(seed|0),t=spec.t,key=spec.key,pw=poolWords(unit),pc=poolChars(unit);
 if(t==='pick'){const w=D.BYW[key],modes=['py','hear'];if(w.emo)modes.push('emoji');const mode=modes[Math.floor(rng()*modes.length)];
  if(mode==='py'){const r=pyOptions(w.w,rng,pw);return{t,mode,key,show:w.w,options:r.options,answer:r.correct,say:w.w}}
  const others=shuffleWith(pw.filter(x=>x.w!==w.w&&x.w.length===w.w.length&&(mode!=='emoji'||x.emo)),rng).slice(0,3);
  if(others.length<3){const r=pyOptions(w.w,rng,pw);return{t,mode:'py',key,show:w.w,options:r.options,answer:r.correct,say:w.w}}
  const options=shuffleWith([w.w,...others.map(x=>x.w)],rng);
  return mode==='emoji'?{t,mode,key,emoji:w.emo,options,answer:w.w,say:w.w}:{t,mode,key,options,answer:w.w,say:w.w}}
 if(t==='build'){const c=CHARS[key],decoys=shuffleWith(Object.keys(COMPS).filter(g=>COMPS[g].u<=unit&&!c.parts.includes(g)),rng).slice(0,2);
  return{t,key,layout:c.lay,py:c.p,say:c.c,tiles:shuffleWith([...c.parts,...decoys],rng),answer:c.parts,sample:null}}
 if(t==='part'){const c=CHARS[key];const decoy=shuffleWith(Object.keys(COMPS).filter(g=>COMPS[g].u<=unit&&!c.parts.includes(g)&&(COMPS[g].ch||COMPS[g].p==='')),rng),d=decoy[0];
  return{t,key,show:c.c,options:shuffleWith([...c.parts,d],rng),answer:c.sem,clue:c.ph?{part:c.ph,py:COMPS[c.ph].p}:null,py:c.p,say:c.c}}
 if(t==='share'){const c=CHARS[key];for(const part of shuffleWith(c.parts,rng)){const withP=pc.filter(x=>x.c!==c.c&&x.parts.includes(part)),without=pc.filter(x=>!x.parts.includes(part));
   if(withP.length&&without.length>=2){const right=withP[Math.floor(rng()*withP.length)];return{t,key,part,py:COMPS[part].p||'',options:shuffleWith([right.c,...shuffleWith(without,rng).slice(0,2).map(x=>x.c)],rng),answer:withP.map(x=>x.c),say:part}}}
  return null}
 if(t==='strokes'){const c=CHARS[key],n=D.strokes(key),set=new Set([n]);for(const d of shuffleWith([-2,-1,1,2,3],rng)){if(set.size>=4)break;if(n+d>0)set.add(n+d)}return{t,key,show:c.c,py:c.p,say:c.c,options:shuffleWith([...set].map(String),rng),answer:String(n)}}
 if(t==='sort'){const cnt={};for(const x of pc)for(const g of x.parts)cnt[g]=(cnt[g]||0)+1;const parts=shuffleWith(Object.keys(cnt).filter(g=>cnt[g]>=2&&pc.filter(x=>!x.parts.includes(g)).length>=4),rng);
  const home=CHARS[key].parts.filter(g=>parts.includes(g));const part=home.length?home[0]:parts[0];if(!part)return null;
  const withP=shuffleWith(pc.filter(x=>x.parts.includes(part)),rng);if(!withP.some(x=>x.c===key)&&CHARS[key].parts.includes(part))withP.unshift(CHARS[key]);const right=withP.slice(0,3),wrong=shuffleWith(pc.filter(x=>!x.parts.includes(part)),rng).slice(0,6-right.length);
  return{t,key,part,py:COMPS[part].p||'',options:shuffleWith([...right,...wrong].map(x=>x.c),rng),answer:right.map(x=>x.c),say:part}}
 if(t==='redup'){const r=REDUP.find(x=>x.w===key);if(!r)return null;const mode=rng()<.5?'pattern':'make';
  if(mode==='pattern'){const pats=['AA','AyA','AABB'];return{t,mode,key,show:r.w,options:pats,answer:r.pat,note:D.REDNOTE[r.pat],say:r.w}}
  const right=D.redupForm(r.base,r.pat),pool=[...r.base].length===1?['AA','AyA','AAA']:['AABB','ABAB','AAB','ABB'],wrong=shuffleWith(pool.filter(x=>x!==r.pat),rng).slice(0,2).map(x=>D.redupForm(r.base,x));
  return{t,mode,key,base:r.base,pat:r.pat,options:shuffleWith([right,...wrong],rng),answer:right,note:D.REDNOTE[r.pat],say:right}}
 if(t==='opp'){const o=OPP.find(x=>x.key===key);if(!o)return null;const flip=rng()<.5,ask=flip?o.b:o.a,right=flip?o.a:o.b;
  const others=shuffleWith(poolOpp(unit).filter(x=>x.key!==key).flatMap(x=>[x.a,x.b]),rng).slice(0,3);if(others.length<3)return null;
  return{t,key,ask,options:shuffleWith([right,...others],rng),answer:right,say:ask}}
 if(t==='odd'){const w=D.BYW[key],same=shuffleWith(pw.filter(x=>x.cat===w.cat&&x.w!==w.w),rng).slice(0,2),diff=shuffleWith(pw.filter(x=>x.cat!==w.cat),rng)[0];
  if(same.length<2||!diff)return null;return{t,key,options:shuffleWith([w.w,...same.map(x=>x.w),diff.w],rng),answer:diff.w,cat:w.cat}}
 if(t==='type'){const w=D.BYW[key],labels=[w.type,...shuffleWith(Object.keys(TYPES).filter(k=>k!==w.type),rng).slice(0,3)];return{t,key,show:w.w,options:shuffleWith(labels,rng),answer:w.type,say:w.w}}
 if(t==='measure'){const m=MEASURES.find(x=>x.n===key),wrong=shuffleWith(MEASURE_SET.filter(x=>!m.ok.includes(x)&&WHOLE[x].u<=unit),rng).slice(0,3),right=m.ok[Math.floor(rng()*m.ok.length)];
  return{t,key,noun:m.n,options:shuffleWith([right,...wrong],rng),answer:m.ok,why:m.why,say:'一'+right+m.n}}
 if(t==='order'){const s=SENTS[+key];let tiles,n=0;do{tiles=shuffleWith(s.tiles,rng);n++}while(n<20&&s.orders.some(o=>o.join('|')===tiles.join('|')));
  return{t,key,tiles,orders:s.orders,text:s.text,py:s.py,say:s.text}}
 if(t==='dde'){const d=DDE[+key];return{t,key,text:d.t,options:['的','地','得'],answer:d.a,why:d.why,say:d.t.replace('＿','')}}
 return null}

// ---- Validators (used on the client for feedback and re-checked by tests) ----
export const checkBuild=(item,placed)=>placed.length===item.answer.length&&placed.every((g,i)=>g===item.answer[i]);
export const checkOrder=(item,placed)=>item.orders.some(o=>o.length===placed.length&&o.every((x,i)=>x===placed[i]));
export const checkPick=(item,choice)=>Array.isArray(item.answer)?item.answer.includes(choice):item.answer===choice;
export const checkSort=(item,picked)=>picked.length===item.answer.length&&item.answer.every(a=>picked.includes(a));

// ---- The Mandarin judge ----
// Heard text is characters. Both sides become toneless pinyin; syllables are matched one by one.
// TONES ARE NOT SCORED here: speech-to-text hands back characters it thinks it heard, often "corrected" toward real words.
// Close sounds a Singapore pupil may produce are given partial credit: zh/z, ch/c, sh/s (flat or missing retroflex), an/ang, en/eng, in/ing.
const INIT=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w'];
const splitSyl=b=>{const i=INIT.find(x=>b.startsWith(x)&&b.length>x.length-0);return i&&b!==i?{i,f:b.slice(i.length)}:{i:'',f:b}};
const FLAT={zh:'z',ch:'c',sh:'s',z:'zh',c:'ch',s:'sh'},NASAL={an:'ang',ang:'an',en:'eng',eng:'en',in:'ing',ing:'in'};
export function sylScore(a,b){ // a = target {base,tone}, b = heard {base,tone}
 if(!b)return 0;if(a.base===b.base)return 1;const x=splitSyl(a.base),y=splitSyl(b.base);
 if(x.f===y.f&&FLAT[x.i]===y.i)return .85;if(x.i===y.i&&NASAL[x.f]===y.f)return .85;
 if(FLAT[x.i]===y.i&&NASAL[x.f]===y.f)return .7;
 if(x.i===y.i&&x.f.replace(/[uü]/,'')===y.f.replace(/[uü]/,''))return .5;return 0}
const GAP=.3;
function align(T,H){ // maximise total score; extra or missing syllables cost GAP
 const n=T.length,m=H.length,sc=Array.from({length:n+1},()=>Array(m+1).fill(0));
 for(let i=1;i<=n;i++)sc[i][0]=-GAP*i*0;for(let j=1;j<=m;j++)sc[0][j]=-GAP*j;
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){sc[i][j]=Math.max(sc[i-1][j-1]+sylScore(T[i-1],H[j-1]),sc[i-1][j],sc[i][j-1]-GAP)}
 const per=Array(n).fill(0);let i=n,j=m;
 while(i>0&&j>0){const d=sc[i-1][j-1]+sylScore(T[i-1],H[j-1]);if(Math.abs(sc[i][j]-d)<1e-9){per[i-1]=sylScore(T[i-1],H[j-1]);i--;j--}else if(Math.abs(sc[i][j]-sc[i-1][j])<1e-9)i--;else j--}
 return{total:Math.max(0,sc[n][m]),per}}
export const CJK=/[\u3400-\u9fff]/;
// target: string of characters. alts: heard strings (best of up to 5). Returns {result, acc, per, hint, heardPy, again}
export function judge(target,alts){
 const T=sylls(target),list=(Array.isArray(alts)?alts:[alts]).slice(0,5).map(x=>String(x||'').replace(/[^\u3400-\u9fff]/g,'').slice(0,30)).map(simp);
 let best=null;
 for(const h of list){if(!h)continue;
  if(h===target){best={acc:100,per:T.map(()=>1),heard:h};break}
  const hs=[...h].map(c=>{const p=toned(c);return p===null?null:stripTone(p)});
  const unread=hs.filter(x=>x===null).length;
  const Hs=hs.map(x=>x||{base:'?',tone:5});
  const r=align(T,Hs),acc=Math.round(100*Math.min(1,r.total/T.length));
  if(!best||acc>best.acc)best={acc,per:r.per,heard:h,unread,hlen:hs.length}}
 // nothing recognisable (silence, English, noise): not the pupil's fault. No miss is recorded for this.
 if(!best||(best.unread!==undefined&&best.unread>=Math.max(1,best.hlen)&&best.acc<25))return{result:'again',acc:0,per:T.map(()=>0),hint:-1,heard:best?best.heard:''};
 const result=best.acc>=85?'correct':best.acc>=50?'near':'try';
 const worst=best.per.reduce((w,s,i)=>s<best.per[w]?i:w,0);
 return{result,acc:best.acc,per:best.per,hint:result==='correct'?-1:worst,heard:best.heard}}
// Simple tone contour for the grown-ups' "hear the tones" view (5 = neutral)
export const CONTOUR={1:'¯',2:'↗',3:'↘↗',4:'↘',5:'·'};
export default {setYoung,poolOpp,checkSort,BOXES,blank,update,mastered,level,mulberry,poolChars,poolWords,poolSents,poolMeasures,poolDde,offered,compose,makeItem,checkBuild,checkOrder,checkPick,judge,sylScore,CONTOUR,CJK,retone};
