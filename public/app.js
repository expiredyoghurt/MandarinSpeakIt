// Mandarin Say It! pupil app (v0.4). Vanilla JS, no third-party hosts. All answers are checked with the same engine the tests use.
import E from './zh-engine.js';
import D from './zh-data.js';
import {T as UT} from './zh-ui.js';
const $=s=>document.querySelector(s),app=$('#app');
const LS={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const S={tok:LS.get('zh_tok'),name:'',guest:false,xp:0,unit:1,cfg:{voice:false,pinyin:'tap'},consent:false,mute:LS.get('zh_mute')==='1',pinyin:LS.get('zh_pinyin')};
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const x in a){if(x==='class')e.className=a[x];else if(x.startsWith('on'))e.addEventListener(x.slice(2),a[x]);else if(a[x]!==false&&a[x]!=null)e.setAttribute(x,a[x]===true?'':a[x])}for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e};
const api=async(p,b,extra={})=>{const r=await fetch(p,{method:b||extra.bin?'POST':'GET',headers:{...(extra.bin?{}:{'content-type':'application/json'}),...(S.tok?{authorization:'Bearer '+S.tok}:{}),...(extra.headers||{})},body:extra.bin||(b?JSON.stringify(b):undefined)});const j=await r.json().catch(()=>({}));return{s:r.status,j}};
const show=(...k)=>{app.replaceChildren(...k)};
const pinyinMode=()=>S.pinyin||S.cfg.pinyin||'tap';
const T=t=>UT(t,pinyinMode()!=='off'); // pinyin over the app's own Chinese (not lesson content)
const setMsg=(el,t)=>el.replaceChildren(...T(t));
// After an answer: show what was just learned with its pinyin (never before the answer, so it cannot give it away).
const rv=text=>{if(pinyinMode()==='off')return null;const w=chars(text,D.pyChars(text),'rv');w.draw(true);return h('div',{class:'reveal'},w)};

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

// ---- Login, join, guest ----
const load=j=>Object.assign(S,{name:j.name,guest:!!j.guest,xp:j.xp,unit:j.unit,cfg:j.cfg,consent:j.consent});
const enter=j=>{S.tok=j.tok;load(j);LS.set('zh_tok',S.tok);home()};
const linkBtn=(t,fn)=>h('button',{class:'link',onclick:fn},T(t));
const stage=(...k)=>h('div',{class:'stage'},...k);
function login(msg){const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),name=h('input',{class:'name',placeholder:'Your name',maxlength:30,'aria-label':'Your name'}),m=h('div',{class:'msg'},msg||'');
 const go=async()=>{const r=await api('/api/login',{name:name.value,code:code.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}enter(r.j)};
 show(h('div',{class:'lantern-row'}),stage(h('h1',{class:'big title','aria-label':'Speak Mandarin, jiǎng huáyǔ'},h('ruby',{},'讲',h('rt',{},'jiǎng')),h('ruby',{},'华语',h('rt',{},'huáyǔ'))),h('div',{class:'prompt'},'Speak Mandarin'),h('div',{class:'field'},code,name,h('button',{class:'go',onclick:go},T('Go! 开始'))),m,
  h('div',{class:'alt'},linkBtn('New here? Make my account 新同学',()=>join()),linkBtn('Play as a guest 客人试玩',guest)),
  h('div',{class:'foot'},h('a',{href:'/teacher.html'},T('Teacher 老师')),' · ',h('a',{href:'/admin.html'},'Admin'))))}
async function guest(){const r=await api('/api/guest',{});if(r.s!==200)return login(r.j.error||'Try again');enter(r.j)}
// Joining is two short steps: class code (checked at once), then a username. A guest uses the same steps and keeps their stars.
function join(msg){const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),m=h('div',{class:'msg'},msg||'');
 const next=async()=>{const r=await api('/api/class-check',{code:code.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}pickName(r.j.code)};
 show(h('div',{class:'lantern-row'}),stage(h('div',{class:'prompt'},T(S.guest?'Join your class 加入班级 (your ⭐ come with you!)':'Join your class 加入班级')),h('div',{class:'field'},code,h('button',{class:'go',onclick:next},T('Next 下一步'))),m,
  h('div',{class:'alt'},linkBtn('Back 返回',()=>S.guest?home():login()))))}
function pickName(code,msg){const name=h('input',{class:'name',placeholder:'Your name',maxlength:30,'aria-label':'Your name'}),m=h('div',{class:'msg'},msg||'');
 const go=async()=>{const r=await api(S.guest?'/api/zh/upgrade':'/api/join',{code,name:name.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}enter(r.j)};
 show(h('div',{class:'lantern-row'}),stage(h('div',{class:'prompt'},T('Pick a name 选一个名字')),h('div',{class:'note'},T('Use your first name or a nickname. Not your full name. 用名字或昵称。')),h('div',{class:'field'},name,h('button',{class:'go',onclick:go},T('Join! 加入'))),m,
  h('div',{class:'alt'},linkBtn('Back 返回',()=>join()))))}

// ---- Home ----
// Pupil toggle: pinyin on tap (default) or always on. Kept on this device. Hidden when the class (or a grown-up) has pinyin off.
const pinBtn=()=>{if(pinyinMode()==='off')return null;const b=h('button',{class:'small pinbtn'});const draw=()=>{const on=pinyinMode()==='on';b.replaceChildren(...UT('拼音',true),' '+(on?'On':'Tap'));b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Pinyin is always on. Press to show pinyin only when tapped.':'Pinyin shows when tapped. Press to always show pinyin.');b.title=b.getAttribute('aria-label')};b.onclick=()=>{S.pinyin=pinyinMode()==='on'?'tap':'on';LS.set('zh_pinyin',S.pinyin);draw()};draw();return b};
async function home(){if(!S.name){const r=await api('/api/zh/me');if(r.s!==200){S.tok=null;LS.set('zh_tok','');return login()}load(r.j)}
 const upto=S.unit;show(h('div',{class:'top'},h('div',{},T('你好'),', '+S.name+'!'),h('div',{class:'sp'}),h('span',{class:'xp'},'⭐ '+S.xp),pinBtn(),muteBtn(),h('button',{class:'small','aria-label':'Grown-ups',onclick:gate},'🔒')),h('div',{class:'lantern-row'}),
  h('div',{class:'stage'},h('div',{class:'card pop'},h('div',{class:'prompt'},T('Unit '+upto+': '+D.UNITS[upto])),h('div',{class:'note'},T('About 12 minutes. 大约十二分钟。'))),
   S.guest?h('div',{class:'card'},h('div',{class:'note'},T('You are playing as a guest. Your teacher cannot see your progress yet. 你现在是客人。')),h('button',{class:'gold',style:'width:100%;margin-top:8px',onclick:()=>join()},T('Join my class 加入班级'))):null,
   h('button',{class:'go',style:'margin-top:auto;min-height:110px;font-size:32px',onclick:play},T('▶ Play 开始玩')),
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
  show(h('div',{class:'top'},h('div',{class:'note'},T(BL[st.blk]||'')),h('div',{class:'sp'}),muteBtn(),h('button',{class:'small',onclick:()=>confirm('Stop for now? 休息一下?')&&home()},'✕')),dots,body);
  const report=async(ok)=>{if(item.t!=='say'){await api('/api/zh/result',{kind:st.k,key:st.key,act:item.t,ok})}if(ok)right++;else missed.push(st);};
  let fin=false;const finish=async(ok,line,extra)=>{if(fin)return;fin=true;await report(ok);const msg=body.querySelector('.msg');if(msg&&item.t!=='say'){setMsg(msg,ok?'好! Great!':'Good try! 再试一试。');msg.classList.add('pop')}
   if(line){const rvEl=line.classList&&line.classList.contains('reveal')?line:line.querySelector&&line.querySelector('.reveal'); // the word with its pinyin sits beside 好! Great!, so it costs no extra height
    if(rvEl&&msg){msg.append(rvEl);msg.classList.add('withrv')}if(line!==rvEl&&line.childNodes.length)body.append(line)}
   body.querySelectorAll('.opts button,.tiles button').forEach(b=>b.disabled=true);body.append(h('button',{class:'go',onclick:()=>{i++;next()}},T('Next 下一个 ▶')));if(extra)extra()};
  RENDER[item.t](item,body,finish,st)};
 next()}
function done(right,missed){show(h('div',{class:'lantern-row'}),h('div',{class:'stage'},h('div',{class:'big'},T('好棒!')),h('div',{class:'prompt'},T('All done for today! 今天到这里。')),h('div',{class:'note'},T(right+' good answers 个好答案')),h('button',{class:'go',style:'margin-top:auto',onclick:async()=>{S.name='';await home()}},T('Home 回家'))))}

const opt=(t,fn,cls)=>h('button',{class:cls||'',onclick:e=>fn(e.currentTarget,t)},t);
function choose(item,body,finish,opts,okFn,cls){const row=h('div',{class:'opts '+(cls||'')},opts.map(o=>opt(o.label||o,b=>{const val=o.value??o,ok=okFn(val);b.classList.add(ok?'good':'try');if(!ok)[...row.children].forEach((c,i)=>{if(okFn(opts[i].value??opts[i]))c.classList.add('good')});finish(ok)})));body.append(row)}
const prompt=(txt,say)=>h('div',{class:'prompt'},T(txt),say?listenBtn(say):null);
const pytap=(wrapEl)=>pinyinMode()==='tap'?h('button',{class:'small',onclick:()=>{wrapEl.draw(true)}},T('拼 pinyin')):null;

const RENDER={
 pick(it,body,finish){const w=D.BYW[it.key];
  if(it.mode==='py'){const c=chars(it.show);body.append(prompt('Which pinyin is right? 哪个拼音对?',it.show),h('div',{class:'big'},c),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>v===it.answer,'sm');speak(it.show)} // pinyin choices already show the word and the right pinyin: no reveal needed
  else if(it.mode==='hear'){body.append(prompt('Listen. Which word? 听一听,是哪个词?'),h('button',{class:'gold',onclick:()=>{const m=S.mute;S.mute=false;speak(it.say);S.mute=m}},T('🔊 Listen 听')),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,rv(it.answer)),it.options,v=>v===it.answer);speak(it.say)}
  else{body.append(prompt('Which word? 这是什么?',it.say),h('div',{class:'big'},it.emoji),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,rv(it.answer)),it.options,v=>v===it.answer);speak(it.say)}},
 odd(it,body,finish){body.append(prompt('Which one is different? 哪一个不一样?'),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,rv(it.answer)),it.options,v=>v===it.answer)},
 build(it,body,finish){const placed=[],n=it.answer.length,slots=Array.from({length:n},()=>h('div',{class:'slot'}));const fr=h('div',{class:'frame '+it.layout},slots),tiles=h('div',{class:'tiles'});
  const redraw=()=>{slots.forEach((s,i)=>{s.textContent=placed[i]||'';s.classList.toggle('f',!!placed[i])});[...tiles.children].forEach(b=>{b.disabled=placed.includes(b.dataset.g)});if(placed.length===n){const ok=E.checkBuild(it,placed);slots.forEach(s=>s.classList.add(ok?'good':'try'));finish(ok,ok?null:h('div',{class:'note'},T('它是 '),it.answer.join(' + ')))}};
  slots.forEach((s,i)=>s.addEventListener('click',()=>{if(placed.length===n)return;if(i<placed.length){placed.splice(i);redraw()}}));
  it.tiles.forEach(g=>tiles.append(h('button',{'data-g':g,onclick:()=>{if(placed.length<n){placed.push(g);redraw()}}},g)));
  body.append(prompt('Build the character. 把字拼起来。',it.say),h('div',{class:'py'},it.py),fr,h('div',{class:'msg'}),tiles);speak(it.say)},
 part(it,body,finish){body.append(prompt('Which part tells the meaning? 哪一部分表示意思?',it.say),h('div',{class:'big'},it.show),h('div',{class:'py'},it.py),h('div',{class:'msg'}));
  choose(it,body,(ok)=>finish(ok,it.clue?h('div',{class:'note'},T('🔔 '+it.clue.part+' ('+it.clue.py+') is a sound clue. Clues help, but they are not always right! 声旁只是线索。')):null),it.options,v=>v===it.answer,'three')},
 share(it,body,finish){body.append(prompt('Which one has the same part '+it.part+'? 哪个字也有 '+it.part+'?',it.part),h('div',{class:'big'},it.part),h('div',{class:'msg'}));choose(it,body,finish,it.options,v=>it.answer.includes(v),'three')},
 type(it,body,finish){const c=chars(it.show);body.append(prompt('How is this word made? 这个词怎么组成?',it.say),h('div',{class:'big'},c),h('div',{class:'msg'}));
  choose(it,body,(ok)=>finish(ok,rv(it.show)),it.options.map(k=>({label:D.TYPES[k].zh+' '+D.TYPES[k].en.split(':')[0],value:k})),v=>v===it.answer,'sm');speak(it.say)},
 measure(it,body,finish){body.append(prompt('Pick the measure word. 选量词。',it.say),h('div',{class:'big'},'一 ＿ '+it.noun),h('div',{class:'msg'}));
  choose(it,body,(ok)=>finish(ok,h('div',{},rv('一'+it.answer[0]+it.noun),h('div',{class:'note'},it.why))),it.options,v=>it.answer.includes(v),'sm')},
 dde(it,body,finish){body.append(prompt('的 地 得? 选一个。'),h('div',{class:'big',style:'font-size:clamp(30px,8vmin,60px)'},it.text),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{},rv(it.text.replace('＿',it.answer)),h('div',{class:'note'},it.answer+': '+it.why))),it.options,v=>v===it.answer,'three')},
 order(it,body,finish){const placed=[],line=h('div',{class:'line'}),tiles=h('div',{class:'tiles'});
  const redraw=()=>{line.replaceChildren(...placed.map((t,i)=>h('button',{onclick:()=>{placed.splice(i,1);redraw()}},t)));[...tiles.children].forEach(b=>b.disabled=placed.includes(b.dataset.g)||false);
   if(placed.length===it.tiles.length){const ok=E.checkOrder(it,placed);line.classList.add(ok?'good':'try');finish(ok,rv(it.text)||(ok?null:h('div',{class:'note'},it.text)))}};
  it.tiles.forEach(t=>tiles.append(h('button',{'data-g':t,onclick:()=>{if(placed.length<it.tiles.length){placed.push(t);redraw()}}},t)));
  body.append(prompt('Put the words in order. 把词语排好。'),line,h('div',{class:'msg'}),tiles)},
 strokes(it,body,finish){body.append(prompt('How many strokes? 一共几画?',it.say),h('div',{class:'big'},it.show),h('div',{class:'py'},it.py),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{class:'note'},it.show+' = '+it.answer+' 画')),it.options,v=>v===it.answer,'sm')},
 opp(it,body,finish){body.append(prompt('Which means the opposite? 反义词是哪个?',it.say),h('div',{class:'big'},it.ask),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,rv(it.ask+'↔'+it.answer)||h('div',{class:'note'},it.ask+' ↔ '+it.answer)),it.options,v=>v===it.answer)},
 redup(it,body,finish){if(it.mode==='pattern'){const c=chars(it.show);body.append(prompt('How is this word made? 这个词是什么重叠?',it.say),h('div',{class:'big'},c),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{},rv(it.show),h('div',{class:'note'},it.note))),it.options.map(k=>({label:k==='AyA'?'A一A':k,value:k})),v=>v===it.answer,'three');speak(it.say)}
  else{const lab=it.pat==='AyA'?'A一A':it.pat;body.append(prompt('Make '+lab+' from '+it.base+'. 哪个是 '+lab+'?'),h('div',{class:'big'},it.base),h('div',{class:'msg'}));choose(it,body,(ok)=>finish(ok,h('div',{},rv(it.answer),h('div',{class:'note'},it.note))),it.options,v=>v===it.answer,'three')}},
 sort(it,body,finish){const picked=new Set(),row=h('div',{class:'opts three'}),msg=h('div',{class:'msg'});
  it.options.forEach(c=>row.append(h('button',{'data-g':c,'aria-pressed':'false',onclick:e=>{const b=e.currentTarget;if(picked.has(c)){picked.delete(c);b.classList.remove('gold')}else{picked.add(c);b.classList.add('gold')}b.setAttribute('aria-pressed',picked.has(c))}},c)));
  const chk=h('button',{class:'go',onclick:()=>{if(!picked.size)return;const ok=E.checkSort(it,[...picked]);[...row.children].forEach(b=>{b.classList.remove('gold');const inA=it.answer.includes(b.dataset.g);if(inA)b.classList.add('good');else if(picked.has(b.dataset.g))b.classList.add('try')});chk.remove();finish(ok,h('div',{class:'note'},T('All the characters with '+it.part+' 都有 '+it.part)))}},T('Check 检查'));
  body.append(prompt('Tap every character that has the part '+it.part+'. 点出所有有 '+it.part+' 的字。',it.part),h('div',{class:'big'},it.part),msg,row,chk)},
 say(it,body,finish){sayScreen(it,body,finish)}};

// ---- Say it! ----
let stream=null;
async function toWav(blob){const ctx=new (window.AudioContext||window.webkitAudioContext)(),buf=await ctx.decodeAudioData(await blob.arrayBuffer()),len=Math.ceil(buf.duration*16000),off=new OfflineAudioContext(1,len,16000),src=off.createBufferSource();src.buffer=buf;src.connect(off.destination);src.start();const out=await off.startRendering(),d=out.getChannelData(0),pcm=new DataView(new ArrayBuffer(44+d.length*2));
 const W=(o,s)=>[...s].forEach((c,i)=>pcm.setUint8(o+i,c.charCodeAt(0)));W(0,'RIFF');pcm.setUint32(4,36+d.length*2,true);W(8,'WAVEfmt ');pcm.setUint32(16,16,true);pcm.setUint16(20,1,true);pcm.setUint16(22,1,true);pcm.setUint32(24,16000,true);pcm.setUint32(28,32000,true);pcm.setUint16(32,2,true);pcm.setUint16(34,16,true);W(36,'data');pcm.setUint32(40,d.length*2,true);
 for(let i=0;i<d.length;i++)pcm.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);ctx.close();return pcm.buffer}
function sayScreen(it,body,finish){const c=chars(it.text),msg=h('div',{class:'msg'},T('Listen, then say it. 听一听,读一读。')),meter=h('div',{class:'meter'},h('i',{style:'width:0'}));
 const res=r=>{if(r.s===429){msg.textContent=r.j.error;return}if(r.s!==200){setMsg(msg,r.j.off?'Voice practice is not on right now. We can still play!':'We could not check that one. Good try! 没关系。');skip();return}
  const j=r.j;if(j.result==='again'){msg.textContent=j.note;again();return}S.xp+=j.xp||0;meter.firstChild.style.width=(j.total*10)+'%';
  const ok=j.result==='correct';setMsg(msg,ok?'好! You said it! +'+j.xp+' ⭐':j.result==='near'?'Nearly! Listen again. 差不多!':'Good try! 再听一听。');
  if(!ok&&j.hint>=0)c.draw(true);finish(ok||j.result==='near',null)};
 const skip=()=>body.append(h('button',{class:'go',onclick:()=>finish(true)},T('Next 下一个 ▶')));
 const again=()=>{rec.disabled=false};
 const rec=h('button',{class:'go',onclick:async()=>{rec.disabled=true;
   try{stream=stream||await navigator.mediaDevices.getUserMedia({audio:true})}catch{setMsg(msg,'I cannot hear you, but that is okay. We can still play. 没关系!');skip();return}
   const mr=new MediaRecorder(stream),parts=[];mr.ondataavailable=e=>parts.push(e.data);msg.textContent='🎤 …';
   mr.onstop=async()=>{try{const wav=await toWav(new Blob(parts));res(await api('/api/zh/score',null,{bin:wav,headers:{'x-item':encodeURIComponent(it.k+':'+it.key),'content-type':'audio/wav'}}))}catch{setMsg(msg,'Good try! 没关系。');skip()}};
   mr.start();const ms=it.k==='s'?8000:3500;let t=0;const tick=setInterval(()=>{t+=100;meter.firstChild.style.width=Math.min(100,t*100/ms)+'%'},100);setTimeout(()=>{clearInterval(tick);mr.state!=='inactive'&&mr.stop()},ms)}},T('🎤 Say it 读'));
 body.append(h('div',{class:'prompt'},T('Read aloud 大声读'),listenBtn(it.text)),h('div',{class:'big'},c),pytap(c),msg,meter,rec);speak(it.text)}

// ---- Grown-ups: behind an arithmetic gate ----
function gate(){const a=3+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*5),inp=h('input',{type:'number',inputmode:'numeric','aria-label':'Answer',style:'min-height:75px;font-size:28px;border-radius:16px;padding:0 12px'});
 show(h('div',{class:'stage'},h('div',{class:'prompt'},'Grown-ups only. What is '+a+' × '+b+'?'),inp,h('button',{class:'go',onclick:()=>+inp.value===a*b?parent():home()},'OK'),h('button',{onclick:home},'Back')))}
function parent(){const c=h('input',{type:'checkbox',style:'width:32px;height:32px'});c.checked=S.consent;
 const sel=h('select',{style:'font-size:20px;min-height:48px'},[['','Use the class setting'],['on','Always show pinyin'],['tap','Tap to show pinyin'],['off','Never show pinyin']].map(([v,t])=>h('option',{value:v,selected:(S.pinyin||'')===v},t)));sel.onchange=()=>{S.pinyin=sel.value||null;LS.set('zh_pinyin',sel.value)};
 c.onchange=async()=>{S.consent=(await api('/api/zh/consent',{yes:c.checked})).j.consent};
 const rows=D.WORDS.filter(w=>w.u<=S.unit).map(w=>h('tr',{},h('td',{},w.w),h('td',{},D.pyChars(w.w).join(' ')),h('td',{},D.pyChars(w.w).map(sy=>E.CONTOUR[D.stripTone(sy).tone]).join(' ')),h('td',{},listenBtn(w.w))));
 show(h('div',{class:'top'},h('div',{},'For grown-ups'),h('div',{class:'sp'}),h('button',{class:'small',onclick:home},'Back')),h('div',{class:'stage parent'},
  S.guest?h('div',{class:'card'},h('div',{class:'note'},'Speaking practice is for pupils in a class. Join a class first, then a grown-up can say yes here.')):h('div',{class:'card'},h('label',{},c,' I say yes to my child practising speaking aloud. The class teacher must also switch voice on. Sound is sent to a speech service to be checked and is not kept. Only the score is kept.'),h('div',{class:'note'},'Not sure? Leave this off. Everything else still works.')),
  h('div',{class:'card'},h('label',{},'Pinyin: ',sel)),
  h('div',{class:'card'},h('b',{},'Hear the tones'),h('div',{class:'note'},'Contours: ¯ high flat · ↗ rising · ↘↗ dipping · ↘ falling · · light. The app checks the sounds of the syllables but does NOT check tones yet.'),h('table',{},rows)),
  h('button',{onclick:()=>{if(S.guest&&!confirm('Guest progress is kept only on this device. If you sign out you will lose it. Join a class first to keep it. Sign out anyway?'))return;S.tok=null;S.name='';S.guest=false;LS.set('zh_tok','');login()}},'Sign out')))}

if(S.tok)home();else login();
