-- v0.7 upgrade. Run once in the D1 Console BEFORE deploying v0.7 on a database made with v0.1 to v0.6.
-- (A NEW database only needs schema.sql, which already includes this.)
alter table students add column avatar text;
alter table students add column pic text;
create table if not exists zh_fail(student_id integer primary key,n integer default 0,ts integer default 0);
create table if not exists zh_event(id integer primary key autoincrement,student_id integer,ev text,ref text,ms integer default 0,day integer);
create index if not exists ze_s on zh_event(student_id,day);
create table if not exists zh_report(id integer primary key autoincrement,word text,reason text,code text,student_id integer,ts integer,done integer default 0);
create index if not exists zr_w on zh_report(word,done);
