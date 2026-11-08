// Mandarin Say It! Worker (v0.4). Cloudflare Worker + D1. No Durable Objects yet (no multiplayer in this version).
import E from '../public/zh-engine.js';
import D from '../public/zh-data.js';
import {MAXU,zhCfg,engines,runEngine,score,scoreHeard,sayTier,SAY_CAP,SAY_DAILY,SAY_GAP,SAY_MAXBYTES} from './speech.js';

const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const enc=new TextEncoder();
const b64=buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
async function hmac(k,m){const key=await crypto.subtle.importKey('raw',enc.encode(k),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,enc.encode(m)))}
const sign=async(env,p)=>{const m=btoa(JSON.stringify(p));return m+'.'+await hmac(env.SECRET,m)};
async function verify(env,t){try{const[m,s]=t.split('.');return s===await hmac(env.SECRET,m)?JSON.parse(atob(m)):null}catch{return null}}
async function pbkdf(pw,salt){const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:100000},k,256))}
const dayNo=now=>Math.floor((now+28800)/86400); // Singapore days
const KINDS=new Set(['c','w','m','s','d','o']),ACTS=new Set(['pick','odd','build','part','share','type','measure','order','dde','redup','opp','sort','strokes']);
const CODE_ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Guests are ordinary pupils kept under a reserved class code that no teacher can own (real codes never start with an underscore).
const GUEST='_GUEST',GUEST_KEEP_DAYS=30;
const cleanName=s=>String(s||'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,30);
const parseCode=s=>String(s||'').trim().toUpperCase().slice(0,12);

async function classSettings(D_,code){const c=await D_.prepare('select settings from classes where code=?').bind(code).first();try{return c?JSON.parse(c.settings||'{}'):{}}catch{return{}}}
async function prof(DB,id){let p=await DB.prepare('select * from zh_prof where student_id=?').bind(id).first();if(!p){await DB.prepare('insert or ignore into zh_prof(student_id) values(?)').bind(id).run();p=await DB.prepare('select * from zh_prof where student_id=?').bind(id).first()}return p}
async function states(DB,id){const m=new Map();for(const r of (await DB.prepare('select * from zh_state where student_id=?').bind(id).all()).results)m.set(r.kind+':'+r.key,{h:JSON.parse(r.h),d:JSON.parse(r.d),box:r.box,due:r.due});return m}
const putState=(DB,id,kind,key,st,now)=>DB.prepare('insert into zh_state(student_id,kind,key,h,d,box,due,upd) values(?,?,?,?,?,?,?,?) on conflict(student_id,kind,key) do update set h=excluded.h,d=excluded.d,box=excluded.box,due=excluded.due,upd=excluded.upd').bind(id,kind,key,JSON.stringify(st.h),JSON.stringify(st.d),st.box,st.due,now);

// Advance a pupil to the next unit when 70% of the current unit's characters are mastered (a guess to calibrate), never past the class cap.
async function maybeAdvance(DB,id,pf,cap){let u=pf.unit,moved=false;const S=await states(DB,id);
 while(u<Math.min(MAXU,cap)){const cs=D.UNIT_ITEMS(u).chars;if(!cs.length)break;const m=cs.filter(c=>E.mastered(S.get('c:'+c.c))).length;if(m/cs.length>=.7){u++;moved=true}else break}
 if(moved)await DB.prepare('update zh_prof set unit=?,upd=? where student_id=?').bind(u,Math.floor(Date.now()/1000),id).run();return{unit:u,moved}}

// One slot per voice submission, claimed first and checked after, so a burst cannot get through (same rule as English Say It!).
async function claim(DB,a,tag){
 const now=Math.floor(Date.now()/1000),ins=await DB.prepare("insert into speech_attempts(student_id,word,engine,accuracy,xp,ts) values(?,?,'',0,0,?)").bind(a.id,tag,now).run(),rid=ins.meta.last_row_id;
 const lim=await DB.prepare('select count(*) n,coalesce(sum(ts>=? and id<?),0) near from speech_attempts where student_id=? and ts>?').bind(now-SAY_GAP,rid,a.id,now-86400).first();
 if(lim.near>0||lim.n>SAY_DAILY){await DB.prepare('delete from speech_attempts where id=?').bind(rid).run();return J({error:lim.near>0?'Wait a moment, then try again.':'That is all the speaking practice for today. See you tomorrow!'},429)}
 return rid}

// Shared by recorded audio and browser recognition. get() -> {alts, cap, engine}
async function listen(env,a,tag,get){
 const DB=env.DB,me=await DB.prepare('select code from students where id=?').bind(a.id).first();if(!me)return J({error:'Not signed in'},401);a={...a,code:me.code};
 const set=await classSettings(DB,a.code),cfg=zhCfg(set);
 if(!cfg.on)return J({error:'off',off:1},403);if(!cfg.voice)return J({error:'Voice practice is switched off for your class.',off:1},403);
 const pf=await prof(DB,a.id);if(!pf.consent)return J({error:'A grown-up needs to say yes to voice practice first.',consent:0},403);
 const [k,key]=[tag[0],tag.slice(2)],it=D.sayItem(k,key);
 if(!it||it.u>pf.unit)return J({error:'That has not been taught yet.'},400);
 const rid=await claim(DB,a,tag);if(rid instanceof Response)return rid;
 let res;try{res=await get(it)}catch{await DB.prepare('delete from speech_attempts where id=?').bind(rid).run();return J({error:'The speech checker could not be reached. Please try again.'},502)}
 const out=res.alts?score(it.text,res):res;
 const now=Math.floor(Date.now()/1000);
 if(out.result==='again'){ // engine could not make sense of it: no miss, no XP, slot released
  await DB.prepare('delete from speech_attempts where id=?').bind(rid).run();
  return J({result:'again',xp:0,total:(await DB.prepare('select xp from speech_best where student_id=? and word=?').bind(a.id,tag).first())?.xp|0,heard:'',note:'Good try! Let us listen again.'})}
 const tier=Math.min(SAY_CAP,sayTier(out.acc)),b0=await DB.prepare('select xp from speech_best where student_id=? and word=?').bind(a.id,tag).first(),old=b0?b0.xp:0,gain=Math.max(0,tier-old);
 // Atomic: the gain is computed inside the batch from what is stored, so two quick submissions cannot both be paid the same tier.
 await DB.batch([
  DB.prepare('insert or ignore into speech_best(student_id,word) values(?,?)').bind(a.id,tag),
  DB.prepare('update students set xp=xp+max(0,?-(select xp from speech_best where student_id=? and word=?)) where id=?').bind(tier,a.id,tag,a.id),
  DB.prepare('update speech_best set xp=max(xp,?),best=max(best,?),tries=tries+1,upd=? where student_id=? and word=?').bind(tier,out.acc,now,a.id,tag),
  DB.prepare('update speech_attempts set engine=?,accuracy=?,xp=? where id=?').bind(res.engine||'browser',out.acc,gain,rid)]);
 const ok=out.result==='correct';
 // Speaking counts toward mastery for words and sentences, but a 'near' is not a miss against the pupil's record
 if(out.result!=='near'){const S=await states(DB,a.id),day=dayNo(now);await putState(DB,a.id,k,key,E.update(S.get(k+':'+key),ok,day),now).run();await DB.prepare('insert into zh_log(student_id,act,kind,key,ok,day) values(?,?,?,?,?,?)').bind(a.id,'say',k,key,ok?1:0,day).run()}
 const tot=await DB.prepare('select xp from speech_best where student_id=? and word=?').bind(a.id,tag).first();
 return J({result:out.result,acc:out.acc,xp:gain,total:tot.xp,hint:out.hint,per:out.per,heard:String(out.heard||'').slice(0,40)})}

async function wipe(DB,id){await DB.batch(['zh_prof','zh_state','zh_log','speech_best','speech_attempts'].map(t=>DB.prepare(`delete from ${t} where student_id=?`).bind(id)).concat([DB.prepare('delete from students where id=?').bind(id)]))}

export default{async fetch(req,env){
 const u=new URL(req.url),p=u.pathname,D_=env.DB;
 if(!p.startsWith('/api/'))return env.ASSETS?env.ASSETS.fetch(req):new Response('Not found',{status:404});
 const bearer=async()=>verify(env,(req.headers.get('authorization')||'').slice(7));
 const adminOk=()=>!!env.ADMIN_KEY&&req.headers.get('x-admin-key')===env.ADMIN_KEY;

 // ---- Audio clips: public GET (they are teacher recordings), admin PUT/DELETE/list ----
 if(p.startsWith('/api/audio/')&&req.method==='GET'){const[,,,kind,name]=p.split('/');const r=await D_.prepare('select type,b64 from audio_clips where kind=? and key=?').bind(kind,decodeURIComponent(name||'')).first();
  if(!r)return new Response('',{status:404});const bin=Uint8Array.from(atob(r.b64),c=>c.charCodeAt(0));return new Response(bin,{headers:{'content-type':r.type,'cache-control':'public, max-age=300'}})}
 if(p==='/api/admin/audio'){if(!adminOk())return J({error:'Wrong admin key'},401);
  if(req.method==='GET')return J({clips:(await D_.prepare('select kind,key,type,bytes,upd from audio_clips order by kind,key').all()).results});
  if(req.method==='POST'){const kind=u.searchParams.get('kind')||'',key=u.searchParams.get('key')||'';if(!/^[a-z]{1,6}$/.test(kind)||!key||key.length>40)return J({error:'bad name'},400);
   const buf=await req.arrayBuffer();if(!buf.byteLength||buf.byteLength>600000)return J({error:'Clip is empty or too long (max about 600 KB)'},400);
   const type=(req.headers.get('content-type')||'audio/webm').split(';')[0];if(!/^audio\//.test(type))return J({error:'Not an audio file'},400);
   await D_.prepare('insert into audio_clips(kind,key,type,b64,bytes,upd) values(?,?,?,?,?,?) on conflict(kind,key) do update set type=excluded.type,b64=excluded.b64,bytes=excluded.bytes,upd=excluded.upd').bind(kind,key,type,b64(buf),buf.byteLength,Math.floor(Date.now()/1000)).run();return J({ok:1})}
  if(req.method==='DELETE'){await D_.prepare('delete from audio_clips where kind=? and key=?').bind(u.searchParams.get('kind'),u.searchParams.get('key')).run();return J({ok:1})}}

 // ---- Binary route (WAV): handled before the JSON body is parsed ----
 if(p==='/api/zh/score'&&req.method==='POST'){const a=await bearer();if(!a||a.r!=='s')return J({error:'Not signed in'},401);
  let tag='';try{tag=decodeURIComponent(req.headers.get('x-item')||'')}catch{} // headers cannot carry Chinese characters, so the browser URL-encodes the item
  if(!/^[ws]:/.test(tag))return J({error:'bad item'},400);
  const buf=await req.arrayBuffer();if(buf.byteLength<1000||buf.byteLength>SAY_MAXBYTES||new TextDecoder().decode(buf.slice(0,4))!=='RIFF')return J({error:'That recording could not be used. Try again.'},400);
  const en=engines(env);if(!en.length)return J({error:'No speech checker is set up yet. Ask your teacher.',off:1},503);
  return listen(env,a,tag,async it=>{let last;for(const name of en){try{const r=await runEngine(name,buf,it.text,env);return{...r,engine:name}}catch(e){last=e}}throw last})}

 let b={};if(req.method==='POST'){try{b=await req.json()}catch{b={}}}
 let a=await bearer();

 // ---- Login, join, guest ----
 // What every sign-in returns. Guests get the default room with voice off (voice needs a class and a grown-up's yes).
 const enter=async(s,code)=>{const set=await classSettings(D_,code),cfg=zhCfg(set),pf=await prof(D_,s.id),g=code===GUEST;
  return{tok:await sign(env,{r:'s',id:s.id,code}),name:g?'Guest':s.name,guest:g,code:g?'':code,xp:s.xp|0,unit:Math.min(pf.unit,cfg.unitCap),cfg:{voice:g?false:cfg.voice,pinyin:cfg.pinyin},consent:g?false:!!pf.consent}};
 // A class that a pupil may join by themselves: it exists, the Chinese room is on, and the teacher has the sign-up switch on.
 const joinable=async code=>{if(!code||code===GUEST)return{err:'Unknown class code',s:404};if(!await D_.prepare('select 1 from classes where code=?').bind(code).first())return{err:'Unknown class code',s:404};
  const set=await classSettings(D_,code);if(!zhCfg(set).on)return{err:'This class is not using the Chinese room.',s:403};
  if(set.enrol==='closed')return{err:'Your teacher has not opened sign-up. Ask your teacher to add you.',s:403};return{ok:1}};
 if(p==='/api/login'){const raw=String(b.name||'').trim().slice(0,30),name=cleanName(b.name),code=parseCode(b.code);
  if(!name||!code||code===GUEST||!await D_.prepare('select 1 from classes where code=?').bind(code).first())return J({error:'Unknown class code or name'},400);
  const set=await classSettings(D_,code),cfg=zhCfg(set);if(!cfg.on)return J({error:'This class is not using the Chinese room.'},403);
  const s=await D_.prepare('select * from students where (name=? or name=?) and code=?').bind(name,raw,code).first();
  if(!s)return J({error:set.enrol==='closed'?'No account with that name. Check the spelling, or ask your teacher.':'No account with that name yet. Check the spelling, or tap "New here?" to make one.',canJoin:set.enrol!=='closed'},404);
  return J(await enter(s,code))}
 // Step 1 of joining: is this class code one I can join? (Lets the app say so before asking for a username.)
 if(p==='/api/class-check'){const code=parseCode(b.code),j=await joinable(code);return j.ok?J({ok:1,code}):J({error:j.err},j.s)}
 // Pupil makes their own account with only the class code and a username.
 if(p==='/api/join'){const code=parseCode(b.code),name=cleanName(b.name);if(!name)return J({error:'Type a name to use'},400);
  const j=await joinable(code);if(!j.ok)return J({error:j.err},j.s);
  let r;try{r=await D_.prepare('insert into students(name,code) values(?,?)').bind(name,code).run()}catch{return J({error:'That name is already used in this class. Pick another name, or sign in if it is you.',taken:1},409)}
  return J(await enter({id:r.meta.last_row_id,name,xp:0},code))}
 // Guest: no class, no name. Untouched guest rows are swept after GUEST_KEEP_DAYS.
 if(p==='/api/guest'){const cut=Math.floor(Date.now()/1000)-GUEST_KEEP_DAYS*86400;
  const old=(await D_.prepare('select s.id from students s left join zh_prof z on z.student_id=s.id where s.code=? and coalesce(z.upd,0)<? limit 20').bind(GUEST,cut).all()).results;for(const o of old)await wipe(D_,o.id);
  for(let i=0;i<5;i++){const name='guest-'+Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>CODE_ALPHA[x%CODE_ALPHA.length]).join('');
   try{const r=await D_.prepare('insert into students(name,code) values(?,?)').bind(name,GUEST).run();await D_.prepare('insert or ignore into zh_prof(student_id,upd) values(?,?)').bind(r.meta.last_row_id,Math.floor(Date.now()/1000)).run();return J(await enter({id:r.meta.last_row_id,name,xp:0},GUEST))}catch{}}
  return J({error:'Try again'},500)}
 if(p==='/api/admin/teacher'&&req.method==='POST'){if(!env.ADMIN_KEY||b.key!==env.ADMIN_KEY)return J({error:'Wrong admin key'},401);
  const user=String(b.user||'').trim(),pw=String(b.pass||'');if(user.length<3||pw.length<6)return J({error:'Username 3+ characters, password 6+ characters'},400);
  const salt=crypto.randomUUID();try{await D_.prepare('insert into teachers(user,salt,hash) values(?,?,?)').bind(user,salt,await pbkdf(pw,salt)).run()}catch{return J({error:'That username is taken'},400)}return J({ok:1})}
 if(p==='/api/teacher/login'){const t=await D_.prepare('select * from teachers where user=?').bind(String(b.user||'')).first();
  if(!t||t.hash!==await pbkdf(String(b.pass||''),t.salt))return J({error:'Wrong username or password'},401);return J({tok:await sign(env,{r:'t',id:t.id}),user:t.user})}

 // ---- Teacher ----
 if(p.startsWith('/api/teacher/')){if(!a||a.r!=='t')return J({error:'Not signed in'},401);
  const own=c=>D_.prepare('select * from classes where code=? and teacher_id=?').bind(String(c||'').toUpperCase(),a.id).first();
  if(p==='/api/teacher/classes')return J({classes:(await D_.prepare('select code,name,settings from classes where teacher_id=?').bind(a.id).all()).results.map(c=>({code:c.code,name:c.name,cfg:zhCfg(JSON.parse(c.settings||'{}')),enrol:JSON.parse(c.settings||'{}').enrol||'open'}))});
  if(p==='/api/teacher/class'){const name=String(b.name||'').trim().slice(0,40);if(!name)return J({error:'Give the class a name'},400);
   for(let i=0;i<6;i++){const code=Array.from(crypto.getRandomValues(new Uint8Array(5)),x=>CODE_ALPHA[x%CODE_ALPHA.length]).join('');
    try{await D_.prepare('insert into classes(code,name,teacher_id,settings) values(?,?,?,?)').bind(code,name,a.id,JSON.stringify({enrol:'closed',zh:{unitCap:MAXU}})).run();return J({code})}catch{}}return J({error:'Try again'},500)}
  if(p==='/api/teacher/settings'){const c=await own(b.code);if(!c)return J({error:'Not your class'},403);const s=JSON.parse(c.settings||'{}'),z=b.zh||{};
   s.zh={...(s.zh||{}),...(z.on!==undefined?{on:!!z.on}:{}),...(z.voice!==undefined?{voice:!!z.voice}:{}),...(z.pinyin?{pinyin:z.pinyin}:{}),...(z.unitCap?{unitCap:z.unitCap|0}:{})};if(b.enrol)s.enrol=b.enrol==='closed'?'closed':'open';
   await D_.prepare('update classes set settings=? where code=?').bind(JSON.stringify(s),c.code).run();return J({cfg:zhCfg(s)})}
  if(p==='/api/teacher/students'){const c=await own(u.searchParams.get('code'));if(!c)return J({error:'Not your class'},403);
   const ss=(await D_.prepare('select s.id,s.name,s.xp,coalesce(z.unit,1) unit,coalesce(z.consent,0) consent from students s left join zh_prof z on z.student_id=s.id where s.code=? order by s.name').bind(c.code).all()).results;
   const rows=(await D_.prepare("select student_id,kind,h,d from zh_state where kind in ('c','w') and student_id in (select id from students where code=?)").bind(c.code).all()).results,m={};
   for(const r of rows){if(E.mastered({h:JSON.parse(r.h),d:JSON.parse(r.d)}))m[r.student_id]=(m[r.student_id]||0)+1}
   return J({students:ss.map(s=>({...s,mastered:m[s.id]||0}))})}
  // Add many pupils at once: a pasted list of first names or nicknames (one per line; commas, semicolons and tabs also split).
  if(p==='/api/teacher/bulk'){const c=await own(b.code);if(!c)return J({error:'Not your class'},403);
   const raw=Array.isArray(b.names)?b.names:String(b.names||'').split(/[\r\n,;\t]+/),seen=new Set(),names=[];
   for(const x of raw){const n=cleanName(x);if(!n)continue;const k=n.toLowerCase();if(seen.has(k))continue;seen.add(k);names.push(n)}
   if(!names.length)return J({error:'No names found. Type or paste one name per line.'},400);if(names.length>300)return J({error:'That is '+names.length+' names. Add up to 300 at a time.'},400);
   const have=new Set((await D_.prepare('select name from students where code=?').bind(c.code).all()).results.map(r=>String(r.name).toLowerCase())),fresh=names.filter(n=>!have.has(n.toLowerCase())),skipped=names.filter(n=>have.has(n.toLowerCase()));
   if(fresh.length)await D_.prepare('insert or ignore into students(name,code) select value,? from json_each(?)').bind(c.code,JSON.stringify(fresh)).run();
   return J({added:fresh.length,skipped})}
  if(p==='/api/teacher/unit'){const s=await D_.prepare('select s.id from students s join classes c on c.code=s.code where s.id=? and c.teacher_id=?').bind(b.id|0,a.id).first();if(!s)return J({error:'Not your pupil'},403);
   await prof(D_,s.id);await D_.prepare('update zh_prof set unit=? where student_id=?').bind(Math.min(MAXU,Math.max(1,b.unit|0)),s.id).run();return J({ok:1})}
  if(p==='/api/teacher/remove'){const s=await D_.prepare('select s.id from students s join classes c on c.code=s.code where s.id=? and c.teacher_id=?').bind(b.id|0,a.id).first();if(!s)return J({error:'Not your pupil'},403);await wipe(D_,s.id);return J({ok:1})}
  return J({error:'Not found'},404)}

 // ---- Pupil ----
 if(p.startsWith('/api/zh/')){if(!a||a.r!=='s')return J({error:'Not signed in'},401);
  const st=await D_.prepare('select id,name,xp,code from students where id=?').bind(a.id).first();if(!st)return J({error:'Not signed in'},401);
  const isGuest=st.code===GUEST,set=await classSettings(D_,st.code),cfg=zhCfg(set);if(!cfg.on)return J({error:'off',off:1},403);a={...a,code:st.code}; // the stored class decides, never the token's
  if(isGuest)cfg.voice=false;
  const pf=await prof(D_,a.id),unit=Math.min(pf.unit,cfg.unitCap);
  if(p==='/api/zh/me')return J({name:isGuest?'Guest':st.name,guest:isGuest,xp:st.xp,unit,consent:!isGuest&&!!pf.consent,cfg:{voice:cfg.voice,pinyin:cfg.pinyin}});
  // A guest becomes a full pupil: same row, new name and class, so XP and progress come with them. Uses the same class-code rules as joining.
  if(p==='/api/zh/upgrade'){if(!isGuest)return J({error:'You are already in a class.'},400);const code=parseCode(b.code),name=cleanName(b.name);if(!name)return J({error:'Type a name to use'},400);
   const j=await joinable(code);if(!j.ok)return J({error:j.err},j.s);
   try{await D_.prepare('update students set name=?,code=? where id=? and code=?').bind(name,code,st.id,GUEST).run()}catch{return J({error:'That name is already used in this class. Pick another name, or sign in if it is you.',taken:1},409)}
   return J(await enter({id:st.id,name,xp:st.xp},code))}
  if(p==='/api/zh/consent'){if(isGuest)return J({error:'Join a class first.'},403);await D_.prepare('update zh_prof set consent=?,upd=? where student_id=?').bind(b.yes?1:0,Math.floor(Date.now()/1000),a.id).run();return J({consent:!!b.yes})}
  if(p==='/api/zh/session'){const now=Math.floor(Date.now()/1000),S=await states(D_,a.id),voice=cfg.voice&&!!pf.consent;
   const r=E.compose({unit,states:S,day:dayNo(now),voice,seed:(Math.random()*1e9)|0});await D_.prepare('update zh_prof set sessions=sessions+1,upd=? where student_id=?').bind(now,a.id).run();return J({unit,steps:r.steps,secs:r.secs})}
  if(p==='/api/zh/result'){const kind=String(b.kind||''),key=String(b.key||''),act=String(b.act||'');
   if(!KINDS.has(kind)||!ACTS.has(act)||!E.offered(kind,key,unit))return J({error:'That item is not available yet.'},400);
   const now=Math.floor(Date.now()/1000),day=dayNo(now),ok=!!b.ok,S=await states(D_,a.id);
   await D_.batch([D_.prepare('insert into zh_log(student_id,act,kind,key,ok,day) values(?,?,?,?,?,?)').bind(a.id,act,kind,key,ok?1:0,day),putState(D_,a.id,kind,key,E.update(S.get(kind+':'+key),ok,day),now)]);
   const adv=await maybeAdvance(D_,a.id,pf,cfg.unitCap);return J({unit:adv.unit,advanced:adv.moved})}
  if(p==='/api/zh/heard'){const tag=(String(b.k||'')+':'+String(b.key||''));if(!/^[ws]:/.test(tag))return J({error:'bad item'},400);return listen(env,a,tag,async it=>({...scoreHeard(it.text,b.alts),engine:'browser'}))}
  return J({error:'Not found'},404)}
 return J({error:'Not found'},404)}}
