// Radical finder 部首查找 (v0.7), reworked for children who do not type.
// Home: "characters I know" (tap one to see its parts) and all parts, newest unit first. Tap a part to see the characters and words that use it.
// One screen at a time and ONE scrolling area (no nested scrolling). maxUnit keeps a pupil to what they have met; the standalone page passes 99 for teachers.
import D from './zh-data.js';
import {openWordCard} from './zh-meaning.js';
import {T} from './zh-ui.js';

const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(x==='class')e.className=v;else if(x.startsWith('on'))e[x]=v;else if(v!==null&&v!==undefined&&v!==false)e.setAttribute(x,v===true?'':v)}e.append(...k.flat().filter(x=>x!=null&&x!==false));return e};
const plain=s=>D.stripTone(s).base;

export function buildIndex(maxUnit=99,unit=maxUnit){
 const chars=Object.values(D.CHARS).filter(c=>c.u<=maxUnit),words=D.WORDS.filter(w=>w.u<=maxUnit);
 const partMap=new Map();for(const c of chars)for(const p of c.parts){if(!partMap.has(p))partMap.set(p,[]);partMap.get(p).push(c)}
 const byChar=new Map();for(const w of words)for(const ch of new Set([...w.w])){if(!byChar.has(ch))byChar.set(ch,[]);byChar.get(ch).push(w)}
 const rads=[];for(const [g,cs] of partMap){const k=D.COMPS[g];if(k&&k.u<=maxUnit)rads.push({g,p:k.p,m:k.m,s:k.s,u:k.u,ch:!!k.ch,chars:cs})}
 const wordsFor=r=>{const list=[...(r.ch?[r.g]:[]),...r.chars.map(c=>c.c)],out=[],seen=new Set();
  for(const ch of list){const ws=(byChar.get(ch)||[]).filter(w=>!seen.has(w.w));ws.forEach(w=>seen.add(w.w));if(ws.length)out.push({ch,words:ws})}return out};
 for(const r of rads){const g=wordsFor(r);r.nWords=g.reduce((n,x)=>n+x.words.length,0);const w=g.flatMap(x=>x.words).find(w=>w.emo);r.emo=w?w.emo:'';r.sample=r.chars[0]?r.chars[0].c:'';r.fresh=r.chars.some(c=>c.u===unit)||r.u===unit}
 // newest unit first (parts that build this unit's characters), then fewer strokes, then unit
 rads.sort((a,b)=>(b.fresh-a.fresh)||a.s-b.s||a.u-b.u||a.g.localeCompare(b.g));
 const known=[...chars].sort((a,b)=>(b.u===unit)-(a.u===unit)||b.u-a.u||a.c.localeCompare(b.c));
 return{rads,partMap,byChar,wordsFor,chars,words,known,radOf:g=>rads.find(r=>r.g===g)}}

// a typed query -> radicals: the radical itself, the parts of a typed character, or a match on its pinyin or English meaning
export function search(ix,q){q=(q||'').trim();if(!q)return ix.rads;const lq=q.toLowerCase().replace(/\s+/g,'');
 const hit=new Set(),add=g=>{const r=ix.rads.find(x=>x.g===g);if(r)hit.add(r)};
 for(const ch of q){if(ix.partMap.has(ch))add(ch);const c=D.CHARS[ch];if(c&&c.u<=99)for(const p of c.parts)add(p)}
 if(/^[a-züv0-9]+$/.test(lq)){for(const r of ix.rads){if(r.p&&plain(r.p).replace('ü','v')===lq.replace('ü','v'))hit.add(r)}}
 for(const r of ix.rads){if(r.m&&r.m.toLowerCase().includes(q.toLowerCase()))hit.add(r)}
 return [...hit]}

export function radicalFinder({maxUnit=99,unit,pinyin='tap',young=false,progress=null,speak,onEvent,report,embedded=false}={}){
 unit=unit||maxUnit;const ix=buildIndex(maxUnit,unit),showPy=pinyin==='on';
 const mastered=c=>!!progress&&progress.mastered.has(c);
 const radDone=r=>!!progress&&r.chars.length>0&&r.chars.every(c=>mastered(c.c)); // sticker: every character built with this part is mastered
 const stack=[];let view={t:'home'},q='',searching=false,moreChars=false,moreRads=false;
 const head=el('div',{class:'rf-top'}),body=el('div',{class:'rf-body'}),root=el('div',{class:'rf'},head,body);
 const go=v=>{stack.push(view);view=v;draw();body.scrollTop=0};
 const goBack=()=>{view=stack.pop()||{t:'home'};draw();body.scrollTop=0};
 const wordCard=(w,e)=>{onEvent&&onEvent('mean',w.w);openWordCard(w.w,{pinyin,opener:e.currentTarget,speak,report})};

 const sticker=r=>radDone(r)?el('span',{class:'rf-st',title:'All mastered'},'🏅'):null;
 const radTile=r=>el('button',{class:'rf-tile'+(r.nWords?'':' dim')+(r.fresh?' new':''),'aria-label':r.g+', '+(r.m||'')+', '+r.nWords+' words'+(radDone(r)?', sticker earned':''),onclick:()=>go({t:'rad',g:r.g})},
  el('span',{class:'rf-g',lang:'zh'},r.g),el('span',{class:'rf-cap',lang:'zh'},r.emo||r.sample||''),el('span',{class:'rf-n'},String(r.nWords)),sticker(r));
 const charTile=c=>el('button',{class:'rf-tile rf-ctile'+(c.u===unit?' new':''),'aria-label':c.c+', '+(c.en||'')+(mastered(c.c)?', mastered':''),onclick:()=>go({t:'char',c:c.c})},
  el('span',{class:'rf-g',lang:'zh'},c.c),showPy?el('span',{class:'rf-cap'},c.p):null,mastered(c.c)?el('span',{class:'rf-st'},'✓'):null);
 const chip=(c,on)=>el('button',{class:'rf-chip'+(on?' on':''),'aria-label':c.c+', '+(c.en||''),onclick:()=>go({t:'char',c:c.c})},el('span',{lang:'zh'},c.c),showPy?el('small',{},c.p):null);
 const wordBtn=w=>el('button',{class:'rf-word','aria-label':'Word '+w.w+', '+w.en,onclick:e=>wordCard(w,e)},w.emo?el('span',{class:'rf-emo','aria-hidden':'true'},w.emo):null,el('span',{lang:'zh'},w.w),showPy?el('small',{},w.py):null);
 const wordGroups=list=>list.length?list.map(g=>el('div',{class:'rf-group'},el('div',{class:'rf-gh',lang:'zh'},g.ch),el('div',{class:'rf-words'},g.words.map(wordBtn)))):[el('div',{class:'rf-hint'},'No words yet for this one.')];
 const sec=(zh,en)=>el('h2',{class:'rf-lab'},el('span',{lang:'zh'},...T(zh)),' ',el('span',{class:'rf-en'},en));

 const drawHome=()=>{
  const bar=el('div',{class:'rf-bar'},el('button',{class:'rf-find','aria-expanded':searching?'true':'false',onclick:()=>{searching=!searching;if(!searching)q='';draw();if(searching)body.querySelector('.rf-in')&&body.querySelector('.rf-in').focus()}},'🔍 Type to find'));
  const out=[bar];
  if(searching){const input=el('input',{type:'search',class:'rf-in',value:q,placeholder:'A radical, a character, pinyin or English','aria-label':'Search radicals'});let t;input.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{q=input.value;draw();const i=body.querySelector('.rf-in');if(i){i.focus();i.setSelectionRange(q.length,q.length)}},150)};out.push(input)}
  if(q){const res=search(ix,q);out.push(el('div',{class:'rf-note',role:'status'},res.length?res.length+' found':'Nothing found. Try a character you know, like 请, or an English word like water.'),el('div',{class:'rf-grid'},res.map(radTile)));return body.replaceChildren(...out.filter(Boolean))}
  const KN=young?12:18,kn=moreChars?ix.known:ix.known.slice(0,KN);
  out.push(sec('我会的字','Characters I know. Tap one to see its parts.'),el('div',{class:'rf-grid'},kn.map(charTile)),ix.known.length>KN?el('button',{class:'rf-more',onclick:()=>{moreChars=!moreChars;draw()}},moreChars?'Show fewer':'Show all '+ix.known.length):null);
  const RN=young?12:24,rs=moreRads?ix.rads:ix.rads.slice(0,RN);
  out.push(sec('全部部首','All parts. The number is how many words use it.'),el('div',{class:'rf-grid'},rs.map(radTile)),ix.rads.length>RN?el('button',{class:'rf-more',onclick:()=>{moreRads=!moreRads;draw()}},moreRads?'Show fewer':'Show all '+ix.rads.length):null);
  body.replaceChildren(...out.filter(Boolean))};

 const drawRad=()=>{const r=ix.radOf(view.g);if(!r){view={t:'home'};return drawHome()}
  body.replaceChildren(el('div',{class:'rf-head'},el('span',{class:'rf-big',lang:'zh'},r.g),el('div',{},el('div',{class:'rf-title'},r.m||''),el('div',{class:'rf-sub'},r.s+' strokes'+(r.p?' · '+r.p:' · part only')),radDone(r)?el('div',{class:'rf-sub'},'🏅 You know every character here!'):null)),
   sec('字','Characters. Tap one.'),el('div',{class:'rf-chips'},r.chars.map(c=>chip(c))),sec('词','Words. Tap one for its meaning.'),...wordGroups(ix.wordsFor(r)))};

 const drawChar=()=>{const c=D.CHARS[view.c];if(!c){view={t:'home'};return drawHome()}
  const parts=c.parts.map(p=>ix.radOf(p)).filter(Boolean),others=parts.map(r=>({r,list:r.chars.filter(x=>x.c!==c.c)})).filter(x=>x.list.length),words=(ix.byChar.get(c.c)||[]);
  body.replaceChildren(...[el('div',{class:'rf-head'},el('span',{class:'rf-big',lang:'zh'},c.c),el('div',{},el('div',{class:'rf-title'},c.en||''),el('div',{class:'rf-sub'},c.p+(mastered(c.c)?' · ✓ mastered':'')))),
   sec('部首','Its parts. Tap one.'),el('div',{class:'rf-grid'},parts.map(radTile)),
   ...others.flatMap(x=>[sec('带这个部分的字','Also have '+x.r.g+' ('+(x.r.m||'')+')'),el('div',{class:'rf-chips'},x.list.map(o=>chip(o)))]),
   words.length?sec('词','Words with '+c.c):null,words.length?el('div',{class:'rf-words'},words.map(wordBtn)):null].filter(Boolean))};

 function draw(){
  head.replaceChildren(...(view.t==='home'||embedded?[]:[el('button',{class:'rf-back','aria-label':'Back',onclick:goBack},'←')]));
  (view.t==='rad'?drawRad:view.t==='char'?drawChar:drawHome)()}
 draw();root.pop=()=>{if(!stack.length)return false;goBack();return true};return root}

const CSS=`.rf{display:flex;flex-direction:column;gap:8px;min-height:0;flex:1;color:#2b2140;font:18px/1.35 "PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
.rf-top:empty{display:none}.rf-back{background:#38307a;color:#fff6e0;border:0;border-radius:22px;min-width:75px;min-height:75px;font-size:30px;cursor:pointer;box-shadow:0 4px 0 #0007}
.rf-body{background:#fff6e0;border-radius:24px;padding:12px 14px 18px;overflow:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
.rf-bar{display:flex}.rf-find{background:#e9defa;color:#2b2140;border:0;border-radius:20px;min-height:75px;padding:0 18px;font:inherit;font-size:20px;cursor:pointer}.rf-find[aria-expanded="true"]{background:#ffc857}
.rf-in{width:100%;min-height:75px;font-size:22px;border-radius:18px;border:3px solid #574777;padding:0 14px;background:#fff;color:#2b2140}
.rf-note{font-size:16px;color:#574777}.rf-lab{margin:6px 0 0;font-size:20px;font-weight:700;line-height:1.9}.rf-en{display:block;font-size:15px;line-height:1.3;font-weight:400;color:#574777}
.rf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px}
.rf-tile{position:relative;background:#e9defa;color:#2b2140;border:0;min-width:84px;min-height:104px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:4px 6px;box-shadow:0 4px 0 #0003;cursor:pointer;font:inherit}
.rf-tile.new{background:#ffe2a0}.rf-tile.dim{opacity:.6}.rf-tile:focus-visible,.rf-chip:focus-visible,.rf-word:focus-visible,.rf-find:focus-visible,.rf-more:focus-visible,.rf-back:focus-visible{outline:4px solid #2b2140;outline-offset:2px}
.rf-g{font-size:40px;line-height:1.2;font-family:"Kaiti SC","STKaiti","KaiTi",serif}.rf-cap{font-size:20px;line-height:1.2;color:#2b2140}.rf-ctile .rf-cap{font-size:15px;color:#574777}
.rf-n{position:absolute;top:6px;left:8px;font-size:13px;font-weight:700;color:#574777}.rf-st{position:absolute;top:4px;right:6px;font-size:18px}
.rf-more{background:none;border:0;color:#574777;text-decoration:underline;min-height:75px;font:inherit;font-size:18px;cursor:pointer}
.rf-head{display:flex;align-items:center;gap:14px}.rf-big{font-size:72px;line-height:1.3;font-family:"Kaiti SC","STKaiti","KaiTi",serif}.rf-title{font-size:24px;font-weight:700}.rf-sub{font-size:16px;color:#574777}
.rf-chips,.rf-words{display:flex;flex-wrap:wrap;gap:10px}
.rf-chip,.rf-word{background:#e9defa;color:#2b2140;border:0;min-height:84px;min-width:84px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 14px;font-size:34px;font-family:"Kaiti SC","STKaiti","KaiTi",serif;box-shadow:0 4px 0 #0003;cursor:pointer}
.rf-chip small,.rf-word small{font:14px "PingFang SC","Noto Sans SC",sans-serif;color:#574777}.rf-word{flex-direction:row;gap:8px;font-size:30px}.rf-emo{font-size:30px}
.rf-gh{font-size:26px;font-family:"Kaiti SC","STKaiti","KaiTi",serif;margin:6px 0 4px}.rf-hint{color:#574777}`;
if(typeof document!=='undefined'&&!document.getElementById('rf-css')){const s=document.createElement('style');s.id='rf-css';s.textContent=CSS;document.head.append(s)}
