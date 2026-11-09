// Speak Mandarin 讲华语: pupil app (v0.7). Vanilla JS, no third-party hosts. Answers are checked with the same engine the tests use.
// v0.7: every question uses one layout (task, picture, answers, feedback sheet); the task is spoken when it appears;
// picture login; unit map and lantern streak on the home screen.
import E from './zh-engine.js';
import D from './zh-data.js';
import {T as UT} from './zh-ui.js';
import {openWordCard} from './zh-meaning.js';
import {radicalFinder} from './radicals.js';
import {checkVoice,speakParts,cancelSpeech,TASK,PRAISE,AGAIN} from './zh-speech.js';
import {AVATARS,PICS,PIC_LEN} from './zh-pic.js';
const $=s=>document.querySelector(s),app=$('#app');
const LS={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
// A teacher preview arrives as #preview=TOKEN. It lives in this tab only and never touches the saved sign-in.
const PREVIEW_TOK=(location.hash.match(/^#preview=([\w.=+\/-]+)$/)||[])[1]||null;
if(PREVIEW_TOK)try{history.replaceState(null,'',location.pathname)}catch{}
const S={tok:PREVIEW_TOK||LS.get('zh_tok'),name:'',guest:false,preview:!!PREVIEW_TOK,xp:0,unit:1,avatar:'',streak:{days:[],run:0},cfg:{voice:false,pinyin:'tap'},consent:false,mute:LS.get('zh_mute')==='1',pinyin:LS.get('zh_pinyin'),young:LS.get('zh_young')};
const MAXU=D.UNITS.length-1;
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const x in a){if(x==='class')e.className=a[x];else if(x.startsWith('on'))e.addEventListener(x.slice(2),a[x]);else if(a[x]!==false&&a[x]!=null)e.setAttribute(x,a[x]===true?'':a[x])}for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e};
const api=async(p,b,extra={})=>{const r=await fetch(p,{method:b||extra.bin?'POST':'GET',headers:{...(extra.bin?{}:{'content-type':'application/json'}),...(S.tok?{authorization:'Bearer '+S.tok}:{}),...(extra.headers||{})},body:extra.bin||(b?JSON.stringify(b):undefined)});const j=await r.json().catch(()=>({}));return{s:r.status,j}};
const ping=(ev,ref)=>{if(S.tok&&!S.guest)api('/api/zh/event',{ev,ref}).catch(()=>{})}; // usage counts for the teacher: no content, never blocks the pupil
const youngOn=()=>S.young==='1'?true:S.young==='0'?false:!!S.cfg.young;
const pinyinMode=()=>S.pinyin||S.cfg.pinyin||'tap';
const T=t=>UT(t,pinyinMode()!=='off'); // pinyin over the app's own Chinese (never lesson content)
const show=(...k)=>{document.body.classList.toggle('young',youngOn());cancelSpeech();
 const pv=S.preview?h('div',{class:'previewbar'},h('span',{},'👀 Preview: nothing is saved'),h('button',{onclick:()=>{try{window.close()}catch{}location.href='/teacher.html'}},'Close')):null;
 app.replaceChildren(...[pv,...k].filter(Boolean))};
const saveTok=t=>{if(!S.preview)LS.set('zh_tok',t||'')};

// ---- Sound. Browser voice (a stated decision). A recorded clip is used for a single word if the teacher made one. ----
let cur=null;
export function speak(text,kind,force){if((S.mute&&!force)||!text)return;try{cur&&cur.pause()}catch{}cancelSpeech();
 let spoke=false;const fb=()=>{if(spoke)return;spoke=true;speakParts([text],{rate:.8})}; // the clip may fail twice (error event and play promise): speak once
 if(S.preview||(!kind&&text.length>8))return fb();
 const a=new Audio('/api/audio/'+(kind||(text.length>4?'s':'w'))+'/'+encodeURIComponent(text));cur=a;a.onerror=fb;a.play().catch(fb)}
// task phrase, then the word: spoken automatically when an item appears (force = the pupil tapped 🔊, so speak even if muted)
function say(task,word,force){if(S.mute&&!force)return;const w=word?String(word).replace(/[^\p{Script=Han}A-Za-z]/gu,' ').replace(/\s+/g,' ').trim():'';
 if(task)speakParts([task],{rate:.85,onend:()=>{if(w)speak(w,undefined,force)}});else if(w)speak(w,undefined,force)}
const replay=(task,word)=>say(task,word,true);
const muteBtn=()=>h('button',{class:'ib sm','aria-label':'Sound on or off','aria-pressed':S.mute?'true':'false',onclick:e=>{S.mute=!S.mute;LS.set('zh_mute',S.mute?'1':'0');e.currentTarget.textContent=S.mute?'🔕':'🔔';e.currentTarget.setAttribute('aria-pressed',S.mute?'true':'false');if(S.mute)cancelSpeech()}},S.mute?'🔕':'🔔');
let voiceOk=LS.get('zh_voice')!=='0';
checkVoice().then(v=>{voiceOk=v.found;LS.set('zh_voice',v.found?'1':'0');const lock=document.querySelector('.lockbtn');if(lock)lock.classList.toggle('badge',!v.found)});

// characters, with pinyin above when the class setting (or the grown-up) says so, or on tap
function chars(text,py,cls){const mode=pinyinMode(),wrap=h('span',{class:'chars '+(cls||'')});const pys=py||D.pyChars(text);
 const draw=on=>{wrap.replaceChildren(...[...text].map((c,i)=>on&&pys[i]?h('ruby',{},c,h('rt',{},pys[i])):c))};draw(mode==='on');wrap.draw=draw;return wrap}

// ---- Sign-in: typed (class code + name) or pictures ----
const load=j=>Object.assign(S,{name:j.name,guest:!!j.guest,xp:j.xp,unit:j.unit,cfg:j.cfg,consent:j.consent,avatar:j.avatar||'',preview:!!j.preview||S.preview,streak:j.streak||S.streak});
const enter=j=>{S.tok=j.tok;load(j);saveTok(S.tok);home()};
const linkBtn=(t,fn)=>h('button',{class:'link',onclick:fn},T(t));
const stage=(...k)=>h('div',{class:'stage'},...k);
const back=fn=>h('button',{class:'ib','aria-label':'Back',onclick:fn},'←');
const titleEl=()=>h('h1',{class:'big title','aria-label':'Speak Mandarin, jiǎng huáyǔ'},h('ruby',{},'讲',h('rt',{},'jiǎng')),h('ruby',{},'华语',h('rt',{},'huáyǔ')));
function login(msg){
 if(LS.get('zh_pclass'))return picRoster(LS.get('zh_pclass'));
 const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),name=h('input',{class:'name',placeholder:'Your name',maxlength:30,'aria-label':'Your name'}),m=h('div',{class:'msg','aria-live':'polite'},msg||'');
 const go=async()=>{const r=await api('/api/login',{name:name.value,code:code.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}enter(r.j)};
 show(stage(h('div',{style:'margin-top:6vh'},titleEl(),h('div',{class:'lede'},'Speak Mandarin')),h('div',{class:'field',style:'margin-top:auto'},code,name,h('button',{class:'go',onclick:go},T('Go! 开始'))),m,
  h('div',{class:'alt'},linkBtn('图片登录 Picture login',()=>picCode()),linkBtn('New here? Make my account 新同学',()=>join()),linkBtn('Play as a guest 客人试玩',guest)),
  h('div',{class:'foot'},h('a',{href:'/radicals.html'},'部首'),h('a',{href:'/teacher.html'},T('Teacher 老师')),h('a',{href:'/admin.html'},'Admin'))))}
async function guest(){const r=await api('/api/guest',{});if(r.s!==200)return login(r.j.error||'Try again');enter(r.j)}
function join(msg){const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),m=h('div',{class:'msg','aria-live':'polite'},msg||'');
 const next=async()=>{const r=await api('/api/class-check',{code:code.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}pickName(r.j.code)};
 show(h('div',{class:'bar'},back(()=>S.guest?home():login())),stage(h('div',{class:'lede'},T(S.guest?'Join your class 加入班级 (your ⭐ come with you!)':'Join your class 加入班级')),h('div',{class:'field',style:'margin-top:auto'},code,h('button',{class:'go',onclick:next},T('Next 下一步'))),m))}
function pickName(code,msg){const name=h('input',{class:'name',placeholder:'Your name',maxlength:30,'aria-label':'Your name'}),m=h('div',{class:'msg','aria-live':'polite'},msg||'');
 const go=async()=>{const r=await api(S.guest?'/api/zh/upgrade':'/api/join',{code,name:name.value});if(r.s!==200){m.textContent=r.j.error||'Try again';return}if(r.j.pic){S.tok=r.j.tok;load(r.j);saveTok(S.tok);LS.set('zh_pclass',code);return myPics(r.j)}enter(r.j)};
 show(h('div',{class:'bar'},back(()=>join())),stage(h('div',{class:'lede'},T('Pick a name 选一个名字')),h('div',{class:'note'},T('Use your first name or a nickname. Not your full name. 用名字或昵称。')),h('div',{class:'field',style:'margin-top:auto'},name,h('button',{class:'go',onclick:go},T('Join! 加入'))),m))}
// A new pupil in a picture class sees their three pictures once. The teacher can print them too.
function myPics(j){show(stage(h('div',{class:'lede'},'Remember your 3 pictures!'),h('div',{class:'hero'},h('div',{class:'picbig','aria-hidden':'true'},j.avatar),h('div',{class:'slots'},j.pic.map(i=>h('i',{class:'f','aria-label':'picture '+(i+1)},PICS[i])))),h('button',{class:'go',onclick:()=>home()},T('我记住了 I remember'))))}
// Picture login. Step 1: class code (once per device). Step 2: tap your picture. Step 3: tap your three pictures.
function picCode(msg){const code=h('input',{placeholder:'CLASS CODE',autocapitalize:'characters',maxlength:8,'aria-label':'Class code'}),m=h('div',{class:'msg','aria-live':'polite'},msg||'');
 const next=async()=>{const r=await api('/api/class-roster',{code:code.value});if(r.s!==200){m.textContent=r.j.name?'This class signs in with a name.':(r.j.error||'Try again');return}LS.set('zh_pclass',r.j.code);picRoster(r.j.code,r.j.pupils)};
 show(h('div',{class:'bar'},back(()=>login())),stage(h('div',{class:'lede'},T('图片登录 Picture login')),h('div',{class:'field',style:'margin-top:auto'},code,h('button',{class:'go',onclick:next},T('Next 下一步'))),m))}
async function picRoster(code,pupils){if(!pupils){const r=await api('/api/class-roster',{code});if(r.s!==200){LS.set('zh_pclass','');return r.j.name?login():picCode(r.j.error)}pupils=r.j.pupils}
 show(stage(h('div',{class:'lede'},T('点你的图片 Tap your picture')),pupils.length?h('div',{class:'roster',role:'list'},pupils.map(p=>h('button',{role:'listitem','aria-label':p.name,onclick:()=>picPad(code,p)},h('span',{class:'av','aria-hidden':'true'},p.avatar),h('span',{},p.name)))):h('div',{class:'note'},'No pupils yet. Ask your teacher to add you.'),
  h('div',{class:'alt'},linkBtn('换一个班 Change class',()=>{LS.set('zh_pclass','');picCode()}),linkBtn('Sign in with my name',()=>{LS.set('zh_pclass','');login()}))))}
function picPad(code,p,msg){const got=[],slots=h('div',{class:'slots'},Array.from({length:PIC_LEN},()=>h('i',{})));const m=h('div',{class:'msg','aria-live':'polite'},msg||'');
 const draw=()=>[...slots.children].forEach((s,i)=>{s.textContent=PICS[got[i]]??'';s.classList.toggle('f',got[i]!==undefined)});
 const tap=async i=>{if(got.length>=PIC_LEN)return;got.push(i);draw();if(got.length<PIC_LEN)return;
  const r=await api('/api/login-pic',{code,id:p.id,pic:got});if(r.s===200)return enter(r.j);got.length=0;slots.classList.remove('shake');void slots.offsetWidth;slots.classList.add('shake');setTimeout(draw,350);m.textContent=r.j.error||'Try again'};
 show(h('div',{class:'bar'},back(()=>picRoster(code))),stage(h('div',{class:'hero'},h('div',{class:'picbig','aria-hidden':'true'},p.avatar),h('div',{class:'lede'},p.name),slots,h('div',{class:'lede'},T('选三张图 Tap your 3 pictures'))),m,h('div',{class:'pad'},PICS.map((x,i)=>h('button',{'aria-label':'picture '+(i+1),onclick:()=>tap(i)},x)))))}

// ---- Home: where am I, how am I doing ---- 
const pinBtn=()=>{if(pinyinMode()==='off')return null;const b=h('button',{class:'pinbtn'});const draw=()=>{const on=pinyinMode()==='on';b.replaceChildren(...UT('拼音',true),' '+(on?'On':'Tap'));b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Pinyin is always on. Press to show pinyin only when tapped.':'Pinyin shows when tapped. Press to always show pinyin.');b.title=b.getAttribute('aria-label')};b.onclick=()=>{S.pinyin=pinyinMode()==='on'?'tap':'on';LS.set('zh_pinyin',S.pinyin);draw()};draw();return b};
const unitMap=()=>h('ol',{class:'map','aria-label':'Your units'},Array.from({length:MAXU},(_,i)=>{const n=i+1,cls=n<S.unit?'done':n===S.unit?'now':'lock';return h('li',{class:cls,'aria-current':n===S.unit?'step':null},h('b',{},n<S.unit?'⭐':String(n)),h('span',{class:'sr'},n<S.unit?'finished':n===S.unit?'you are here':'not yet'))}));
const streakRow=()=>{const d=S.streak.days&&S.streak.days.length===7?S.streak.days:Array(7).fill(false);return h('div',{class:'streak','aria-label':'Days you played this week'},h('div',{class:'days'},d.map((on,i)=>h('div',{class:'d'+(on?' lit':'')+(i===6?' today':''),'aria-hidden':'true'},on?'🏮':''))),S.streak.run>=2?h('div',{class:'run'},'🔥 '+S.streak.run+' days'):h('div',{class:'note'},'Light one today!'))};
async function home(){if(!S.name){const r=await api('/api/zh/me');if(r.s!==200){S.tok=null;saveTok('');return login()}load(r.j)}
 const words=h('div',{class:'note'},'');
 show(h('div',{class:'bar'},h('div',{class:'hello'},S.avatar?h('span',{class:'av','aria-hidden':'true'},S.avatar):null,h('span',{class:'nm'},...T('你好'),', '+S.name+'!')),h('div',{class:'sp'}),h('span',{class:'xp','aria-label':S.xp+' stars'},'⭐ '+S.xp),h('button',{class:'ib sm lockbtn'+(voiceOk?'':' badge'),'aria-label':'Grown-ups',onclick:gate},'🔒')),
  h('div',{class:'home'},h('div',{class:'unitcard pop'},h('div',{class:'ut'},T('Unit '+S.unit+': '+D.UNITS[S.unit])),unitMap(),words),
   streakRow(),
   S.guest?h('div',{class:'card'},h('div',{class:'note'},T('You are playing as a guest. Your teacher cannot see your progress yet. 你现在是客人。')),h('button',{class:'gold',style:'width:100%;margin-top:8px',onclick:()=>join()},T('Join my class 加入班级'))):null,
   h('div',{class:'tools'},h('button',{class:'gold',onclick:finder},...T('部首 Radical finder')),pinBtn(),muteBtn()),
   h('button',{class:'play',onclick:play},T('▶ Play 开始玩')),
   S.cfg.voice&&S.consent?h('div',{class:'note'},'🎤 Speaking practice is on.'):null));
 api('/api/zh/progress').then(r=>{if(r.s===200&&words.isConnected)words.textContent='🌟 '+r.j.met.length+' words met'})}
async function finder(){ping('finder');const r=await api('/api/zh/progress');const prog=r.s===200?{mastered:new Set(r.j.mastered),met:new Set(r.j.met)}:{mastered:new Set(),met:new Set()};
 const fr=radicalFinder({maxUnit:S.unit,unit:S.unit,pinyin:pinyinMode()==='on'?'on':'tap',young:youngOn(),progress:prog,speak:w=>speak(w,undefined,true),onEvent:ping,report:reportMeaning,embedded:true});
 show(h('div',{class:'bar'},back(()=>{if(!fr.pop())home()}),h('div',{class:'lede'},...T('部首 Radical finder'))),h('div',{class:'stage',style:'min-height:0;flex:1'},fr))}
const reportMeaning=(word,reason)=>api('/api/zh/report',{word,reason});

// ---- Play: a composed session, one item per screen ----
async function play(){E.setYoung(youngOn());const r=await api('/api/zh/session',{young:youngOn()?1:0});if(r.s!==200)return home();const steps=r.j.steps;if(!steps.length)return done(0);
 let i=0,right=0;
 const next=async()=>{if(i>=steps.length)return done(right);const st=steps[i],seed=(Math.random()*1e9)|0,
   item=st.t==='say'?{t:'say',k:st.k,key:st.key,text:D.sayItem(st.k,st.key).text}:E.makeItem(st,S.unit,seed);
  if(!item){i++;return next()}
  const body=h('div',{class:'stage'}),lanterns=h('div',{class:'lanterns',role:'img','aria-label':'Question '+(i+1)+' of '+steps.length},steps.map((_,j)=>h('i',{class:j<i?'done':j===i?'on':''})));window.__zhItem={item,st};
  show(h('div',{class:'bar'},h('button',{class:'ib sm','aria-label':'Stop for now',onclick:()=>askStop(home)},'✕'),lanterns,muteBtn()),body);
  const t0=Date.now();let fin=false,posted=Promise.resolve();
  // finish(ok, {word, note}): colour the answer at once, then replace the answers with the feedback sheet
  const finish=(ok,info={})=>{if(fin)return;fin=true;
   if(item.t!=='say')posted=api('/api/zh/result',{kind:st.k,key:st.key,act:item.t,ok,ms:Date.now()-t0}).catch(()=>{});
   if(ok)right++;
   body.querySelectorAll('.opts button,.tiles button').forEach(b=>b.disabled=true);
   setTimeout(()=>{if(!body.isConnected)return;body.classList.add('done');
    body.append(sheetEl(ok,info,async()=>{await posted;i++;next()}));
    const plain=info.word||null;say(ok?PRAISE:AGAIN,plain)},item.t==='say'?0:420)};
  RENDER[item.t](item,body,finish,st)};
 next()}
function sheetEl(ok,info,onNext){const w=info.word,wb=w&&D.BYW[w]?D.BYW[w]:null;
 const word=w?h('div',{class:'word',lang:'zh'},wb&&wb.emo?h('span',{class:'emo','aria-hidden':'true'},wb.emo):null,(()=>{const c=chars(w,D.pyChars(w));c.draw(pinyinMode()!=='off');return c})()):null;
 const row=w?h('div',{class:'row'},word,h('button',{class:'ib','aria-label':'Listen',onclick:()=>replay(null,w)},'🔊'),wb?h('button',{class:'ib','aria-label':'Meaning',onclick:e=>{ping('mean',w);openWordCard(w,{pinyin:pinyinMode(),opener:e.currentTarget,speak:x=>speak(x,undefined,true),report:reportMeaning})}},'📖'):null):null;
 return h('div',{class:'sheet'+(ok?'':' again'),role:'status'},h('div',{class:'verdict'},...T(ok?'好棒! Great!':'再试一试。 Good try!')),row,info.note?h('div',{class:'note'},info.note):null,h('button',{class:'next',onclick:onNext},...T('Next 下一个 ▶')))}
function askStop(onStop){const m=h('div',{class:'modal'},h('div',{class:'sheet again',role:'dialog','aria-modal':'true','aria-label':'Stop for now?'},h('div',{class:'verdict'},...T('休息一下? Take a break?')),
  h('button',{class:'go',onclick:()=>m.remove()},'Keep playing'),h('button',{class:'gold',onclick:()=>{m.remove();onStop()}},...T('Home 回家'))));app.append(m);m.querySelector('button').focus()}
function done(right){show(stage(h('div',{class:'hero'},h('div',{class:'emoji','aria-hidden':'true'},'🏮'),h('div',{class:'big'},...T('好棒!')),h('div',{class:'lede'},T('All done for today! 今天到这里。')),h('div',{class:'note'},T(right+' good answers 个好答案'))),h('button',{class:'go',onclick:async()=>{S.name='';await home()}},T('Home 回家'))));say(PRAISE,null)}

const opt=(t,fn,cls)=>h('button',{class:cls||'',onclick:e=>fn(e.currentTarget,t)},t);
function choose(item,body,finish,opts,okFn,cls){const row=h('div',{class:'opts '+(cls||'')},opts.map(o=>opt(o.label||o,b=>{const val=o.value??o,ok=okFn(val);b.classList.add(ok?'good':'try');if(!ok)[...row.children].forEach((c,i)=>{if(okFn(opts[i].value??opts[i]))c.classList.add('good')});finish(ok)})));body.append(h('div',{class:'answers'},row))}
// the task: Chinese with pinyin (the main line), English underneath, and a big 🔊 that is always in the same corner. Spoken as soon as it appears.
const taskBar=(zh,en,parts)=>h('div',{class:'task'},h('div',{class:'tx'},h('div',{class:'zh',lang:'zh'},...T(zh)),h('div',{class:'en'},en)),h('button',{class:'say','aria-label':'Listen again',onclick:()=>replay(parts[0],parts[1])},'🔊'));
const scene=(body,zh,en,parts,hero)=>{body.append(taskBar(zh,en,parts),h('div',{class:'hero'},...hero));setTimeout(()=>say(parts[0],parts[1]),120)};
const pytap=wrapEl=>pinyinMode()==='tap'?h('button',{class:'gold',onclick:e=>{wrapEl.draw(true);e.currentTarget.remove()}},...T('拼 pinyin')):null;
const answers=(...k)=>h('div',{class:'answers'},...k);

const RENDER={
 pick(it,body,finish){
  if(it.mode==='py'){const c=chars(it.show);c.draw(false);scene(body,'哪个拼音对?','Which pinyin is right?',[TASK.py,it.show],[h('div',{class:'big'},c)]);choose(it,body,ok=>finish(ok,{word:it.show}),it.options,v=>v===it.answer,'sm')} // never show the pinyin before the answer here
  else if(it.mode==='hear'){scene(body,'听一听,是哪个词?','Listen. Which word?',[TASK.hear,it.say],[h('div',{class:'emoji','aria-hidden':'true'},'👂')]);choose(it,body,ok=>finish(ok,{word:it.answer}),it.options,v=>v===it.answer)}
  else{scene(body,'这是什么?','Which word?',[TASK.emoji,it.say],[h('div',{class:'emoji','aria-hidden':'true'},it.emoji)]);choose(it,body,ok=>finish(ok,{word:it.answer}),it.options,v=>v===it.answer)}},
 odd(it,body,finish){scene(body,'哪一个不一样?','Which one is different?',[TASK.odd],[h('div',{class:'emoji','aria-hidden':'true'},'🤔')]);choose(it,body,ok=>finish(ok,{word:it.answer}),it.options,v=>v===it.answer)},
 build(it,body,finish){const placed=[],n=it.answer.length,slots=Array.from({length:n},()=>h('div',{class:'slot'}));const fr=h('div',{class:'frame '+it.layout},slots),tiles=h('div',{class:'tiles'});
  const redraw=()=>{slots.forEach((s,i)=>{s.textContent=placed[i]||'';s.classList.toggle('f',!!placed[i])});[...tiles.children].forEach(b=>{b.disabled=placed.includes(b.dataset.g)});if(placed.length===n){const ok=E.checkBuild(it,placed);slots.forEach(s=>s.classList.add(ok?'good':'try'));finish(ok,{word:it.say,note:ok?null:h('span',{},...T('它是 '),it.answer.join(' + '))})}};
  slots.forEach((s,i)=>s.addEventListener('click',()=>{if(placed.length===n)return;if(i<placed.length){placed.splice(i);redraw()}}));
  it.tiles.forEach(g=>tiles.append(h('button',{'data-g':g,onclick:()=>{if(placed.length<n){placed.push(g);redraw()}}},g)));
  scene(body,'把字拼起来。','Build the character.',[TASK.build,it.say],[h('div',{class:'py'},it.py),fr]);body.append(answers(tiles))},
 part(it,body,finish){scene(body,'哪一部分表示意思?','Which part tells the meaning?',[TASK.part,it.say],[h('div',{class:'big'},it.show),h('div',{class:'py'},it.py)]);
  choose(it,body,ok=>finish(ok,{word:it.show,note:it.clue?T('🔔 '+it.clue.part+' ('+it.clue.py+') is a sound clue. Clues help, but they are not always right! 声旁只是线索。'):null}),it.options,v=>v===it.answer,'three')},
 share(it,body,finish){scene(body,'哪个字也有 '+it.part+'?','Which one has the same part '+it.part+'?',['哪个字也有'+it.part],[h('div',{class:'big'},it.part)]);choose(it,body,ok=>finish(ok,{word:it.part,note:it.answer.slice(0,6).join(' ')}),it.options,v=>it.answer.includes(v),'three')},
 type(it,body,finish){const c=chars(it.show);scene(body,'这个词怎么组成?','How is this word made?',[TASK.type,it.say],[h('div',{class:'big'},c)]);
  choose(it,body,ok=>finish(ok,{word:it.show,note:D.TYPES[it.answer].en}),it.options.map(k=>({label:D.TYPES[k].zh+' '+D.TYPES[k].en.split(':')[0],value:k})),v=>v===it.answer,'sm')},
 measure(it,body,finish){scene(body,'选量词。','Pick the measure word.',[TASK.measure,it.say],[h('div',{class:'big'},'一 ＿ '+it.noun)]);
  choose(it,body,ok=>finish(ok,{word:'一'+it.answer[0]+it.noun,note:it.why}),it.options,v=>it.answer.includes(v),'sm')},
 dde(it,body,finish){scene(body,'的 地 得? 选一个。','Pick the right one.',[TASK.dde],[h('div',{class:'big',style:'font-size:clamp(30px,8vmin,60px)'},it.text)]);choose(it,body,ok=>finish(ok,{word:it.text.replace('＿',it.answer),note:it.answer+': '+it.why}),it.options,v=>v===it.answer,'three')},
 order(it,body,finish){const placed=[],line=h('div',{class:'line'}),tiles=h('div',{class:'tiles'});
  const redraw=()=>{line.replaceChildren(...placed.map((t,i)=>h('button',{onclick:()=>{placed.splice(i,1);redraw()}},t)));[...tiles.children].forEach(b=>b.disabled=placed.includes(b.dataset.g)||false);
   if(placed.length===it.tiles.length){const ok=E.checkOrder(it,placed);line.classList.add(ok?'good':'try');finish(ok,{word:it.text})}};
  it.tiles.forEach(t=>tiles.append(h('button',{'data-g':t,onclick:()=>{if(placed.length<it.tiles.length){placed.push(t);redraw()}}},t)));
  scene(body,'把词语排好。','Put the words in order.',[TASK.order],[line]);body.append(answers(tiles))},
 strokes(it,body,finish){scene(body,'一共几画?','How many strokes?',[TASK.strokes,it.say],[h('div',{class:'big'},it.show),h('div',{class:'py'},it.py)]);choose(it,body,ok=>finish(ok,{word:it.show,note:it.show+' = '+it.answer+' 画'}),it.options,v=>v===it.answer,'sm')},
 opp(it,body,finish){scene(body,'反义词是哪个?','Which means the opposite?',[TASK.opp,it.say],[h('div',{class:'big'},it.ask)]);choose(it,body,ok=>finish(ok,{word:it.ask+'↔'+it.answer}),it.options,v=>v===it.answer)},
 redup(it,body,finish){if(it.mode==='pattern'){const c=chars(it.show);scene(body,'这个词是什么重叠?','How is this word made?',[TASK.pattern,it.say],[h('div',{class:'big'},c)]);choose(it,body,ok=>finish(ok,{word:it.show,note:it.note}),it.options.map(k=>({label:k==='AyA'?'A一A':k,value:k})),v=>v===it.answer,'three')}
  else{const lab=it.pat==='AyA'?'A一A':it.pat;scene(body,'哪个是 '+lab+'?','Make '+lab+' from '+it.base+'.',[TASK.make],[h('div',{class:'big'},it.base)]);choose(it,body,ok=>finish(ok,{word:it.answer,note:it.note}),it.options,v=>v===it.answer,'three')}},
 sort(it,body,finish){const picked=new Set(),row=h('div',{class:'opts three'});
  it.options.forEach(c=>row.append(h('button',{'data-g':c,'aria-pressed':'false',onclick:e=>{const b=e.currentTarget;if(picked.has(c)){picked.delete(c);b.classList.remove('gold')}else{picked.add(c);b.classList.add('gold')}b.setAttribute('aria-pressed',picked.has(c))}},c)));
  const chk=h('button',{class:'chk',onclick:()=>{if(!picked.size)return;const ok=E.checkSort(it,[...picked]);[...row.children].forEach(b=>{b.classList.remove('gold');const inA=it.answer.includes(b.dataset.g);if(inA)b.classList.add('good');else if(picked.has(b.dataset.g))b.classList.add('try')});chk.remove();finish(ok,{word:it.part,note:h('span',{},...T('All the characters with '+it.part+' 都有 '+it.part))})}},...T('Check 检查'));
  scene(body,'点出所有有 '+it.part+' 的字。','Tap every character that has the part '+it.part+'.',['点出所有有'+it.part+'的字'],[h('div',{class:'big'},it.part)]);body.append(answers(row,chk))},
 say(it,body,finish){sayScreen(it,body,finish)}};

// ---- Say it! ----
let stream=null;
async function toWav(blob){const ctx=new (window.AudioContext||window.webkitAudioContext)(),buf=await ctx.decodeAudioData(await blob.arrayBuffer()),len=Math.ceil(buf.duration*16000),off=new OfflineAudioContext(1,len,16000),src=off.createBufferSource();src.buffer=buf;src.connect(off.destination);src.start();const out=await off.startRendering(),d=out.getChannelData(0),pcm=new DataView(new ArrayBuffer(44+d.length*2));
 const W=(o,s)=>[...s].forEach((c,i)=>pcm.setUint8(o+i,c.charCodeAt(0)));W(0,'RIFF');pcm.setUint32(4,36+d.length*2,true);W(8,'WAVEfmt ');pcm.setUint32(16,16,true);pcm.setUint16(20,1,true);pcm.setUint16(22,1,true);pcm.setUint32(24,16000,true);pcm.setUint32(28,32000,true);pcm.setUint16(32,2,true);pcm.setUint16(34,16,true);W(36,'data');pcm.setUint32(40,d.length*2,true);
 for(let i=0;i<d.length;i++)pcm.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);ctx.close();return pcm.buffer}
function sayScreen(it,body,finish){const c=chars(it.text),msg=h('div',{class:'msg','aria-live':'polite'},T('Listen, then say it. 听一听,读一读。')),meter=h('div',{class:'meter',style:'width:100%'},h('i',{style:'width:0'}));
 const setMsg=t=>msg.replaceChildren(...T(t));
 const end=(ok)=>finish(ok,{word:it.text});
 const res=r=>{if(r.s===429){msg.textContent=r.j.error;return}if(r.s!==200){setMsg(r.j.off?'Voice practice is not on right now. We can still play!':'We could not check that one. Good try! 没关系。');return end(true)}
  const j=r.j;if(j.result==='again'){msg.textContent=j.note;rec.disabled=false;return}S.xp+=j.xp||0;meter.firstChild.style.width=(j.total*10)+'%';
  const ok=j.result==='correct';setMsg(ok?'好! You said it! +'+j.xp+' ⭐':j.result==='near'?'Nearly! Listen again. 差不多!':'Good try! 再听一听。');
  if(!ok&&j.hint>=0)c.draw(true);end(ok||j.result==='near')};
 const rec=h('button',{class:'go',onclick:async()=>{rec.disabled=true;
   try{stream=stream||await navigator.mediaDevices.getUserMedia({audio:true})}catch{setMsg('I cannot hear you, but that is okay. We can still play. 没关系!');return end(true)}
   const mr=new MediaRecorder(stream),parts=[];mr.ondataavailable=e=>parts.push(e.data);msg.textContent='🎤 …';
   mr.onstop=async()=>{try{const wav=await toWav(new Blob(parts));res(await api('/api/zh/score',null,{bin:wav,headers:{'x-item':encodeURIComponent(it.k+':'+it.key),'content-type':'audio/wav'}}))}catch{setMsg('Good try! 没关系。');end(true)}};
   mr.start();const ms=it.k==='s'?8000:3500;let t=0;const tick=setInterval(()=>{t+=100;meter.firstChild.style.width=Math.min(100,t*100/ms)+'%'},100);setTimeout(()=>{clearInterval(tick);mr.state!=='inactive'&&mr.stop()},ms)}},...T('🎤 Say it 读'));
 scene(body,'大声读。','Read aloud.',[TASK.say,it.text],[h('div',{class:'big'},c),pytap(c),msg,meter]);body.append(answers(rec))}

// ---- Grown-ups: behind an arithmetic gate ----
function gate(){const a=3+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*5),inp=h('input',{type:'number',inputmode:'numeric','aria-label':'Answer',style:'min-height:75px;font-size:28px;border-radius:16px;padding:0 12px;border:4px solid var(--gold)'});
 show(h('div',{class:'bar'},back(home)),stage(h('div',{class:'lede'},'Grown-ups only. What is '+a+' × '+b+'?'),inp,h('button',{class:'go',onclick:()=>+inp.value===a*b?parent():home()},'OK')))}
function parent(){const c=h('input',{type:'checkbox',style:'width:32px;height:32px'});c.checked=S.consent;
 const ysel=h('select',{style:'font-size:20px;min-height:48px'},[['','Use the class setting'],['1','Younger learners (ages 6 to 9)'],['0','Standard']].map(([v,t])=>h('option',{value:v,selected:(S.young||'')===v},t)));ysel.onchange=()=>{S.young=ysel.value||null;LS.set('zh_young',ysel.value);document.body.classList.toggle('young',youngOn())};
 const sel=h('select',{style:'font-size:20px;min-height:48px'},[['','Use the class setting'],['on','Always show pinyin'],['tap','Tap to show pinyin'],['off','Never show pinyin']].map(([v,t])=>h('option',{value:v,selected:(S.pinyin||'')===v},t)));sel.onchange=()=>{S.pinyin=sel.value||null;LS.set('zh_pinyin',sel.value)};
 c.onchange=async()=>{S.consent=(await api('/api/zh/consent',{yes:c.checked})).j.consent};
 const rows=D.WORDS.filter(w=>w.u<=S.unit).map(w=>h('tr',{},h('td',{},w.w),h('td',{},D.pyChars(w.w).join(' ')),h('td',{},D.pyChars(w.w).map(sy=>E.CONTOUR[D.stripTone(sy).tone]).join(' ')),h('td',{},h('button',{class:'ib sm','aria-label':'Listen to '+w.w,style:'min-height:48px;min-width:48px;width:48px;font-size:20px',onclick:()=>speak(w.w,undefined,true)},'🔊'))));
 const voice=h('div',{class:'card'},h('b',{},'Sound on this device'),h('div',{class:'note',role:'status'},'Checking…'),h('button',{style:'min-height:48px;margin-top:6px;background:var(--soft);color:var(--ink)',onclick:()=>say(null,'你好',true)},'🔊 Test: 你好'));
 checkVoice().then(v=>{voiceOk=v.found;LS.set('zh_voice',v.found?'1':'0');voice.querySelector('.note').textContent=!v.supported?'This browser cannot speak. Questions will be silent. Ask the teacher to use Chrome, Edge or Safari.':v.found?'A Chinese voice was found ('+v.name+'). Questions will be read aloud.':'No Chinese voice found. Questions will be silent. On iPad: Settings > Accessibility > Spoken Content > Voices > Chinese. On Windows or Chromebook: add a Chinese (Mandarin) language pack. Then reload.'});
 show(h('div',{class:'bar'},h('div',{class:'lede'},'For grown-ups'),h('div',{class:'sp'}),h('button',{class:'ib',onclick:home,'aria-label':'Back'},'←')),h('div',{class:'stage parent'},
  voice,
  S.guest?h('div',{class:'card'},h('div',{class:'note'},'Speaking practice is for pupils in a class. Join a class first, then a grown-up can say yes here.')):h('div',{class:'card'},h('label',{},c,' I say yes to my child practising speaking aloud. The class teacher must also switch voice on. Sound is sent to a speech service to be checked and is not kept. Only the score is kept.'),h('div',{class:'note'},'Not sure? Leave this off. Everything else still works.')),
  h('div',{class:'card'},h('label',{},'Pinyin: ',sel)),
  h('div',{class:'card'},h('label',{},'Learner level: ',ysel)),
  h('div',{class:'card'},h('b',{},'Hear the tones'),h('div',{class:'note'},'Contours: ¯ high flat · ↗ rising · ↘↗ dipping · ↘ falling · · light. The app checks the sounds of the syllables but does NOT check tones yet.'),h('table',{},rows)),
  h('button',{onclick:()=>{if(S.guest&&!confirm('Guest progress is kept only on this device. If you sign out you will lose it. Join a class first to keep it. Sign out anyway?'))return;S.tok=null;S.name='';S.guest=false;LS.set('zh_tok','');LS.set('zh_pclass','');login()}},'Sign out')))}

if(S.tok)home();else login();
