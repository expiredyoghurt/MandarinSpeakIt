-- Mandarin Say It! v0.1 schema. Run this whole file once in the D1 Console on a NEW database.
-- Upgrading later? Run only the numbered file(s) in migrations/ that the README lists, BEFORE deploying.
create table if not exists teachers(id integer primary key autoincrement,user text unique,salt text,hash text);
create table if not exists classes(code text primary key,name text,teacher_id integer,settings text default '{}');
create table if not exists students(id integer primary key autoincrement,name text collate nocase,code text,xp integer default 0,unique(name,code));
-- zh_prof: one row per pupil. unit = how far through the content the pupil has reached (1 to 5). consent = a grown-up said yes to voice practice.
create table if not exists zh_prof(student_id integer primary key,unit integer default 1,consent integer default 0,sessions integer default 0,upd integer default 0);
-- zh_state: mastery per character (c), word (w), measure word noun (m), sentence (s), de/di/de item (d). h = last 6 results, d = days seen, box = review box, due = day number.
create table if not exists zh_state(student_id integer,kind text,key text,h text default '[]',d text default '[]',box integer default 0,due integer default 0,upd integer default 0,primary key(student_id,kind,key));
create table if not exists zh_log(id integer primary key autoincrement,student_id integer,act text,kind text,key text,ok integer,day integer);
create index if not exists zl_s on zh_log(student_id,day);
-- speech_best holds what each pupil has earned from each spoken item (XP is capped per item); speech_attempts logs every voice submission. No audio and no transcript are stored.
create table if not exists speech_best(student_id integer,word text,xp integer default 0,best integer default 0,tries integer default 0,upd integer default 0,primary key(student_id,word));
create table if not exists speech_attempts(id integer primary key autoincrement,student_id integer,word text,engine text,accuracy integer default 0,xp integer default 0,ts integer default (unixepoch()));
create index if not exists sa_s on speech_attempts(student_id,ts);
-- Recorded prompts made by the teacher in Admin > Audio. Teacher recordings only, never pupil audio.
create table if not exists audio_clips(kind text,key text,type text default 'audio/wav',b64 text,bytes integer default 0,upd integer default 0,primary key(kind,key));
