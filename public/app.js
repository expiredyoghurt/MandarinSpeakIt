// Mandarin Say It! pupil app (v0.1). Vanilla JS, no third-party hosts. All answers are checked with the same engine the tests use.
import E from './zh-engine.js';
import D from './zh-data.js';
const $=s=>document.querySelector(s),app=$('#app');
const LS={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const S={tok:LS.get('zh_tok'),name:'',xp:0,unit:1,cfg:{voice:false,pinyin:'tap'},consent:false,mute:LS.get('zh_mute')==='1',pinyin:LS.get('zh_pinyin')};
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const x in a){if(x==='class')e.className=a[x];else if(x.startsWith('on'))e.addEventListener(x.slice(2),a[x]);else if(a[x]!==false&&a[x]!=null)e.setAttribute(x,a[x]===true?'':a[x])}for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e};
const api=async(p,b,extra={})=>{const r=await fetch(p,{method:b||extra.bin?'POST':'GET',headers:{...(extra.bin?{}:{'content-type':'application/json'}),...(S.tok?{authorization:'Bearer '+S.tok}:{}),...(extra.headers||{})},body:extra.bin||(b?JSON.stringify(b):undefined)});const j=await r.json().catch(()=>({}));return{s:r.status,j}};
const show=(...k)=>{app.replaceChildren(...k)};
const pinyinMode=()=>S.pinyin||S.cfg.pinyin||'tap';

// ---- Audio: a recorded clip if the teacher made one, else the browser voice. Every prompt has a mute button. ----
let cur=null;
export function speak(text,kind){if(S.mute||!text)return;try{cur&&cur.pause()}catch{}speechSynthesis&&speechSynthesis.cancel();
 const fb=()=>{if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.8;speechSynthesis.speak(u)};
 const a=new Audio('/api/audio/'+(kind||(text.length>4?'s':'w'))+'/'+encodeURIComponent(text));cur=a;a.onerror=fb;a.play().catch(fb)}
const muteBtn=()=>h('button',{class:'small','aria-label':'Sound on or off',onclick:e=>{S.mute=!S.mute;LS.set('zh_mute',S.mute?'1':'0');e.currentTarget.textContent=S.mute?'🔇':'🔊'}},S.mute?'🔇':'🔊');
const listenBtn=t=>h('button',{class:'small','aria-label':'Listen',onclick:()=>{const m=S.mute;S.mute=false;speak(t);S.mute=m}},'👂');
// characters, with pinyin above when the class setting (or the grown-up) says so, or on tap
function chars(text,py,cls){const mode=pinyinMode(),wrap=h('span',{class:'chars '+(cls||'')});const draw=show=>{wrap.replaceChildren(...[...text].map((c,i)=>show&&py[i]?h('ruby',{},c,h('rt',{},py[i])):c))};
 const pys=py||D.pyChars(text);py=pys;draw(mode==='on');wrap.draw=draw;return wrap}

// ---- Login ----
function login(msg){const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),name=h('input',{class:'name',placeholder:'Your name',maxlength:30,'aria-label':'Your name'}),m=h('div',{class:'msg'},msg||'');
 const go=async()=>{const r=await api('/api/login',{name:name.value,code:code.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}Object.assign(S,{tok:r.j.tok,name:r.j.name,xp:r.j.xp,unit:r.j.unit,cfg:r.j.cfg,consent:r.j.consent});LS.set('zh_tok',S.tok);home()};
 show(h('div',{class:'lantern-row'}),h('div',{class:'stage'},h('div',{class:'big'},'夜市'),h('div',{class:'prompt'},'Night Market Chinese · 华文夜市'),h('div',{class:'field'},code,name,h('button',{class:'go',onclick:go},'Go! 开始')),m))}

// ---- Home ----
async function home(){if(!S.name){const r=await api('/api/zh/me');if(r.s!==200){S.tok=null;LS.set('zh_tok','');return login()}Object.assign(S,{name:r.j.name,xp:r.j.xp,unit:r.j.unit,cfg:r.j.cfg,consent:r.j.consent})}
 const upto=S.unit;show(h('div',{class:'top'},h('div',{},'你好, '+S.name+'!'),h('div',{class:'sp'}),h('span',{class:'xp'},'⭐ '+S.xp),muteBtn(),h('button',{class:'small','aria-label':'Grown-ups',onclick:gate},'🔒')),h('div',{class:'lantern-row'}),
  h('div',{class:'stage'},h('div',{class:'card pop'},h('div',{class:'prompt'},'Unit '+upto+': '+D.UNITS[upto]),h('div',{class:'note'},'About 12 minutes. 大约十二分钟。')),
   h('button',{class:'go',style:'margin-top:auto;min-height:110px;font-size:32px',onclick:play},'▶ Play 开始玩'),
   h('div',{class:'note'},S.cfg.voice&&S.consent?'🎤 Speaking practice is on.':'')))}

// ---- Play: a composed session, one item per screen ----
const BL={review:'Remember 复习',new:'New 新的',practice:'Practice 练习',say:'Say it! 读一读'};
async function play(){const r=await api('/api/zh/session',{});if(r.s!==200)return home();const steps=r.j.steps;if(!steps.length)return done(0,[]);
 let i=0,right=0,missed=[];
 const next=async()=>{if(i>=steps.length)return done(right,missed);const st=steps[i],seed=(Math.random()*1e9)|0,
   item=st.t==='say'?{t:'say',k:st.k,key:st.key,text:D.sayItem(st.k,st.key).text}:E.makeItem(st,S.unit,seed);
  if(!item){i++;return next()}
  const dots=h('div',{class:'dots'},steps.map((_,j)=>h('i',{class:j<i?'done':j===i?'on':''})));
  const body=h('div',{class:'stage'});window.__zhItem={item,st};
  show(h('div',{class:'top'},h('div',{class:'note'},BL[st.blk]||''),h('div',{class:'sp'}),muteBtn(),h('button',{class:'small',onclick:()=>confirm('Stop for now? 休息一下?')&&home()},'✕')),dots,body);
  const report=async(ok)=>{if(item.t!=='say'){await api('/api/zh/result',{kind:st.k,key:st.key,act:item.t,ok})}if(ok)right++;else missed.push(st);};
  let fin=false;const finish=async(ok,line,extra)=>{if(fin)return;fin=true;await report(ok);const msg=body.querySelector('.msg');if(msg&&item.t!=='say'){msg.textContent=ok?'好! Great!':'Good try! 再试一试。';msg.classList.add('pop')}
   if(line)body.append(line);body.querySelectorAll('.opts button,.tiles button').forEach(b=>b.disabled=true);body.append(h('button',{class:'go',onclick:()=>{i++;next()}},'Next 下一个 ▶'));if(extra)extra()};
  RENDER[item.t](item,body,finish,st)};
 next()}
function done(right,missed){show(h('div',{class:'lantern-row'}),h('div',{class:'stage'},h('div',{class:'big'},'好棒!'),h('div',{class:'prompt'},'All done for today! 今天到这里。'),h('div',{class:'note'},right+' good answers 个好答案'),h('button',{class:'go',style:'margin-top:auto',onclick:async()=>{S.name='';await home()}},'Home 回家')))}

const opt=(t,fn,cls)=>h('button',{class:cls||'',onclick:e=>fn(e.currentTarget,t)},t);
function choose(item,body,finish,opts,okFn,cls){const row=h('div',{class:'opts '+(cls||'')},opts.map(o=>opt(o.label||o,b=>{const val=o.value??o,ok=okFn(val);b.classList.add(ok?'good':'try');if(!ok)[...row.children].forEach((c,i)=>{if(okFn(opts[i].value??opts[i]))c.classList.add('good')});finish(ok)})));body.append(row)}
const prompt=(txt,say)=>h('div',{class:'prompt'},txt,say?listenBtn(say):null);
const pytap=(wrapEl)=>pinyinMode()==='tap'?h('button',{class:'small',onclick:()=>{wrapEl.draw(true)}},'拼 pinyin'):null;

const RENDER={
 pick(it,body,finish){const w=D.BYW[it.key];
  if(it.mode==='py'){const c=chars(it.show);body.append(prompt('Which pinyin is right? 哪个拼音对?',it.show),h('div',{class:'big'},c),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>v===it.answer,'sm');speak(it.show)}
  else if(it.mode==='hear'){body.append(prompt('Listen. Which word? 听一听,是哪个词?'),h('button',{class:'gold',onclick:()=>{const m=S.mute;S.mute=false;speak(it.say);S.mute=m}},'🔊 Listen 听'),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>v===it.answer);speak(it.say)}
  else{body.append(prompt('Which word? 这是什么?',it.say),h('div',{class:'big'},it.emoji),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>v===it.answer);speak(it.say)}},
 odd(it,body,finish){body.append(prompt('Which one is different? 哪一个不一样?'),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>v===it.answer)},
 build(it,body,finish){const placed=[],n=it.answer.length,slots=Array.from({length:n},()=>h('div',{class:'slot'}));const fr=h('div',{class:'frame '+it.layout},slots),tiles=h('div',{class:'tiles'});
  const redraw=()=>{slots.forEach((s,i)=>{s.textContent=placed[i]||'';s.classList.toggle('f',!!placed[i])});[...tiles.children].forEach(b=>{b.disabled=placed.includes(b.dataset.g)});if(placed.length===n){const ok=E.checkBuild(it,placed);slots.forEach(s=>s.classList.add(ok?'good':'try'));finish(ok,ok?null:h('div',{class:'note'},'它是 '+it.answer.join(' + ')))}};
  slots.forEach((s,i)=>s.addEventListener('click',()=>{if(placed.length===n)return;if(i<placed.length){placed.splice(i);redraw()}}));
  it.tiles.forEach(g=>tiles.append(h('button',{'data-g':g,onclick:()=>{if(placed.length<n){placed.push(g);redraw()}}},g)));
  body.append(prompt('Build the character. 把字拼起来。',it.say),h('div',{class:'py'},it.py),fr,h('div',{class:'msg'}),tiles);speak(it.say)},
 part(it,body,finish){body.append(prompt('Which part tells the meaning? 哪一部分表示意思?',it.say),h('div',{class:'big'},it.show),h('div',{class:'py'},it.py),h('div',{class:'msg'}));
  choose(it,body,(ok)=>finish(ok,it.clue?h('div',{class:'note'},'🔔 '+it.clue.part+' ('+it.clue.py+') is a sound clue. Clues help, but they are not always right! 声旁只是线索。'):null),it.options,v=>v===it.answer,'three')},
 share(it,body,finish){body.append(prompt('Which one has the same part '+it.part+'? 哪个字也有 '+it.part+'?',it.part),h('div',{class:'big'},it.part),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>it.answer.includes(v),'three')},
 type(it,body,finish){const c=chars(it.show);body.append(prompt('How is this word made? 这个词怎么组成?',it.say),h('div',{class:'big'},c),h('div',{class:'msg'}));
  choose(it,body,finish,it.options.map(k=>({label:D.TYPES[k].zh+' '+D.TYPES[k].en.split(':')[0],value:k})),v=>v===it.answer,'sm');speak(it.say)},
 measure(it,body,finish){body.append(prompt('Pick the measure word. 选量词。',it.say),h('div',{class:'big'},'一 ＿ '+it.noun),h('div',{class:'msg'}));
  choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},'一'+it.answer[0]+it.noun+' — '+it.why)),it.options,v=>it.answer.includes(v),'sm')},
 dde(it,body,finish){body.append(prompt('的 地 得? 选一个。'),h('div',{class:'big',style:'font-size:clamp(30px,8vmin,60px)'},it.text),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.answer+': '+it.why)),it.options,v=>v===it.answer,'three')},
 order(it,body,finish){const placed=[],line=h('div',{class:'line'}),tiles=h('div',{class:'tiles'});
  const redraw=()=>{line.replaceChildren(...placed.map((t,i)=>h('button',{onclick:()=>{placed.splice(i,1);redraw()}},t)));[...tiles.children].forEach(b=>b.disabled=placed.includes(b.dataset.g)||false);
   if(placed.length===it.tiles.length){const ok=E.checkOrder(it,placed);line.classList.add(ok?'good':'try');finish(ok,ok?null:h('div',{class:'note'},it.text))}};
  it.tiles.forEach(t=>tiles.append(h('button',{'data-g':t,onclick:()=>{if(placed.length<it.tiles.length){placed.push(t);redraw()}}},t)));
  body.append(prompt('Put the words in order. 把词语排好。'),line,h('div',{class:'msg'}),tiles)},
 strokes(it,body,finish){body.append(prompt('How many strokes? 一共几画?',it.say),h('div',{class:'big'},it.show),h('div',{class:'py'},it.py),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.show+' = '+it.answer+' 画')),it.options,v=>v===it.answer,'sm')},
 opp(it,body,finish){body.append(prompt('Which means the opposite? 反义词是哪个?',it.say),h('div',{class:'big'},it.ask),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.ask+' ↔ '+it.answer)),it.options,v=>v===it.answer)},
 redup(it,body,finish){if(it.mode==='pattern'){const c=chars(it.show);body.append(prompt('How is this word made? 这个词是什么重叠?',it.say),h('div',{class:'big'},c),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.note)),it.options.map(k=>({label:k==='AyA'?'A一A':k,value:k})),v=>v===it.answer,'three');speak(it.say)}
  else{const lab=it.pat==='AyA'?'A一A':it.pat;body.append(prompt('Make '+lab+' from '+it.base+'. 哪个是 '+lab+'?'),h('div',{class:'big'},it.base),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.answer+' — '+it.note)),it.options,v=>v===it.answer,'three')}},
 sort(it,body,finish){const picked=new Set(),row=h('div',{class:'opts three'}),msg=h('div',{class:'msg'});
  it.options.forEach(c=>row.append(h('button',{'data-g':c,'aria-pressed':'false',onclick:e=>{const b=e.currentTarget;if(picked.has(c)){picked.delete(c);b.classList.remove('gold')}else{picked.add(c);b.classList.add('gold')}b.setAttribute('aria-pressed',picked.has(c))}},c)));
  const chk=h('button',{class:'go',onclick:()=>{if(!picked.size)return;const ok=E.checkSort(it,[...picked]);[...row.children].forEach(b=>{b.classList.remove('gold');const inA=it.answer.includes(b.dataset.g);if(inA)b.classList.add('good');else if(picked.has(b.dataset.g))b.classList.add('try')});chk.remove();finish(ok,h('div',{class:'note'},'All the characters with '+it.part+' 都有 '+it.part))}},'Check 检查');
  body.append(prompt('Tap every character that has the part '+it.part+'. 点出所有有 '+it.part+' 的字。',it.part),h('div',{class:'big'},it.part),msg,row,chk)},
 say(it,body,finish){sayScreen(it,body,finish)}};

// ---- Say it! ----
let stream=null;
async function toWav(blob){const ctx=new (window.AudioContext||window.webkitAudioContext)(),buf=await ctx.decodeAudioData(await blob.arrayBuffer()),len=Math.ceil(buf.duration*16000),off=new OfflineAudioContext(1,len,16000),src=off.createBufferSource();src.buffer=buf;src.connect(off.destination);src.start();const out=await off.startRendering(),d=out.getChannelData(0),pcm=new DataView(new ArrayBuffer(44+d.length*2));
 const W=(o,s)=>[...s].forEach((c,i)=>pcm.setUint8(o+i,c.charCodeAt(0)));W(0,'RIFF');pcm.setUint32(4,36+d.length*2,true);W(8,'WAVEfmt ');pcm.setUint32(16,16,true);pcm.setUint16(20,1,true);pcm.setUint16(22,1,true);pcm.setUint32(24,16000,true);pcm.setUint32(28,32000,true);pcm.setUint16(32,2,true);pcm.setUint16(34,16,true);W(36,'data');pcm.setUint32(40,d.length*2,true);
 for(let i=0;i<d.length;i++)pcm.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);ctx.close();return pcm.buffer}
function sayScreen(it,body,finish){const c=chars(it.text),msg=h('div',{class:'msg'},'Listen, then say it. 听一听,读一读。'),meter=h('div',{class:'meter'},h('i',{style:'width:0'}));
 const res=r=>{if(r.s===429){msg.textContent=r.j.error;return}if(r.s!==200){msg.textContent=r.j.off?'Voice practice is not on right now. We can still play!':'We could not check that one. Good try! 没关系。';skip();return}
  const j=r.j;if(j.result==='again'){msg.textContent=j.note;again();return}S.xp+=j.xp||0;meter.firstChild.style.width=(j.total*10)+'%';
  const ok=j.result==='correct';msg.textContent=ok?'好! You said it! +'+j.xp+' ⭐':j.result==='near'?'Nearly! Listen again. 差不多!':'Good try! 再听一听。';
  if(!ok&&j.hint>=0)c.draw(true);finish(ok||j.result==='near',null)};
 const skip=()=>body.append(h('button',{class:'go',onclick:()=>finish(true)},'Next 下一个 ▶'));
 const again=()=>{rec.disabled=false};
 const rec=h('button',{class:'go',onclick:async()=>{rec.disabled=true;
   try{stream=stream||await navigator.mediaDevices.getUserMedia({audio:true})}catch{msg.textContent='I cannot hear you, but that is okay. We can still play. 没关系!';skip();return}
   const mr=new MediaRecorder(stream),parts=[];mr.ondataavailable=e=>parts.push(e.data);msg.textContent='🎤 …';
   mr.onstop=async()=>{try{const wav=await toWav(new Blob(parts));res(await api('/api/zh/score',null,{bin:wav,headers:{'x-item':encodeURIComponent(it.k+':'+it.key),'content-type':'audio/wav'}}))}catch{msg.textContent='Good try! 没关系。';skip()}};
   mr.start();const ms=it.k==='s'?8000:3500;let t=0;const tick=setInterval(()=>{t+=100;meter.firstChild.style.width=Math.min(100,t*100/ms)+'%'},100);setTimeout(()=>{clearInterval(tick);mr.state!=='inactive'&&mr.stop()},ms)}},'🎤 Say it 读');
 body.append(h('div',{class:'prompt'},'Read aloud 大声读',listenBtn(it.text)),h('div',{class:'big'},c),pytap(c),msg,meter,rec);speak(it.text)}

// ---- Grown-ups: behind an arithmetic gate ----
function gate(){const a=3+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*5),inp=h('input',{type:'number',inputmode:'numeric','aria-label':'Answer',style:'min-height:75px;font-size:28px;border-radius:16px;padding:0 12px'});
 show(h('div',{class:'stage'},h('div',{class:'prompt'},'Grown-ups only. What is '+a+' × '+b+'?'),inp,h('button',{class:'go',onclick:()=>+inp.value===a*b?parent():home()},'OK'),h('button',{onclick:home},'Back')))}
function parent(){const c=h('input',{type:'checkbox',style:'width:32px;height:32px'});c.checked=S.consent;
 const sel=h('select',{style:'font-size:20px;min-height:48px'},[['','Use the class setting'],['on','Always show pinyin'],['tap','Tap to show pinyin'],['off','Never show pinyin']].map(([v,t])=>h('option',{value:v,selected:(S.pinyin||'')===v},t)));sel.onchange=()=>{S.pinyin=sel.value||null;LS.set('zh_pinyin',sel.value)};
 c.onchange=async()=>{S.consent=(await api('/api/zh/consent',{yes:c.checked})).j.consent};
 const rows=D.WORDS.filter(w=>w.u<=S.unit).map(w=>h('tr',{},h('td',{},w.w),h('td',{},D.pyChars(w.w).join(' ')),h('td',{},D.pyChars(w.w).map(sy=>E.CONTOUR[D.stripTone(sy).tone]).join(' ')),h('td',{},listenBtn(w.w))));
 show(h('div',{class:'top'},h('div',{},'For grown-ups'),h('div',{class:'sp'}),h('button',{class:'small',onclick:home},'Back')),h('div',{class:'stage parent'},
  h('div',{class:'card'},h('label',{},c,' I say yes to my child practising speaking aloud. The class teacher must also switch voice on. Sound is sent to a speech service to be checked and is not kept. Only the score is kept.'),h('div',{class:'note'},'Not sure? Leave this off. Everything else still works.')),
  h('div',{class:'card'},h('label',{},'Pinyin: ',sel)),
  h('div',{class:'card'},h('b',{},'Hear the tones'),h('div',{class:'note'},'Contours: ¯ high flat · ↗ rising · ↘↗ dipping · ↘ falling · · light. The app checks the sounds of the syllables but does NOT check tones yet.'),h('table',{},rows)),
  h('button',{onclick:()=>{S.tok=null;S.name='';LS.set('zh_tok','');login()}},'Sign out')))}

if(S.tok)home();else login();
