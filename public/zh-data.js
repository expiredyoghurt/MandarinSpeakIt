// Mandarin Say It! content bank (v0.1, Tier C: P5-P6 Foundation Chinese). ORIGINAL content, authored for this app; no textbook lists used.
// Everything here is checked by tests/content.test.mjs. English glosses are teacher-view only: never shown to pupils.

// ---- Components. [glyph, toned pinyin or '', meaning, strokes, unit introduced, standalone character (1/0)] ----
const C=[
['女','nǚ','woman',3,1,1],['亻','','person',2,1,0],['口','kǒu','mouth',3,1,1],['子','zǐ','child',3,1,1],['马','mǎ','horse',3,1,1],['也','yě','also',3,1,1],['尔','ěr','you (old)',5,1,0],['门','mén','door',3,1,1],['乃','nǎi','then',2,1,0],['且','qiě','moreover',5,1,0],['未','wèi','not yet',5,1,1],['父','fù','father',4,1,1],['巴','bā','cling',4,1,0],
['氵','','water',3,2,0],['木','mù','tree',4,2,1],['艹','','grass',3,2,0],['日','rì','sun',4,2,1],['月','yuè','moon',4,2,1],['可','kě','can',5,2,1],['每','měi','every',7,2,1],['胡','hú','beard',9,2,0],['化','huà','change',4,2,1],['早','zǎo','early',6,2,1],['采','cǎi','pick',8,2,0],['寸','cùn','inch',3,2,1],['对','duì','correct',5,2,1],['交','jiāo','cross',6,2,1],['气','qì','air',4,2,1],
['饣','','food',3,3,0],['扌','','hand',3,3,0],['足','zú','foot',7,3,1],['心','xīn','heart',4,3,1],['忄','','heart',3,3,0],['目','mù','eye',5,3,1],['手','shǒu','hand',4,3,1],['反','fǎn','opposite',4,3,1],['我','wǒ','I',7,3,1],['包','bāo','wrap',5,3,1],['并','bìng','together',6,3,0],['丁','dīng','nail',2,3,0],['立','lì','stand',5,3,1],['是','shì','is',9,3,1],['兆','zhào','omen',6,3,0],['各','gè','each',6,3,1],['相','xiāng','mutual',9,3,1],['亡','wáng','lose',3,3,0],['少','shǎo','few',4,3,1],['火','huǒ','fire',4,3,1],
['犭','','animal',3,4,0],['纟','','thread',3,4,0],['宀','','roof',3,4,0],['囗','','enclosure',3,4,0],['钅','','metal',5,4,0],['疒','','sickness',5,4,0],['句','jù','sentence',5,4,1],['苗','miáo','sprout',8,4,1],['者','zhě','person who',8,4,1],['工','gōng','work',3,4,1],['录','lù','record',8,4,0],['合','hé','join',6,4,1],['氏','shì','clan',4,4,0],['豕','shǐ','pig',7,4,0],['至','zhì','reach',6,4,1],['玉','yù','jade',5,4,1],['元','yuán','first',4,4,1],['中','zhōng','middle',4,4,1],['冬','dōng','winter',5,4,1],['丙','bǐng','third',5,4,0],
['讠','','speech',2,5,0],['青','qīng','blue-green',8,5,1],
['尼','ní','nun',5,6,0],['干','gān','dry',3,6,1],['先','xiān','first',6,6,1],['奇','qí','strange',8,6,0],['兑','duì','exchange',7,6,0],['卖','mài','sell',8,6,1],['吾','wú','I (old)',7,6,0],['舌','shé','tongue',6,6,1]];
export const COMPS=Object.fromEntries(C.map(([g,p,m,s,u,ch])=>[g,{g,p,m,s,u,ch:!!ch}]));

// ---- Characters built from parts. [char, pinyin, layout (lr left-right, tb top-bottom, enc enclosing), parts in order, meaning part, sound part, category, gloss, unit] ----
// The sound part is a CLUE only (many exceptions). 0 means both parts carry meaning, so no sound clue is taught.
const H=[
['妈','mā','lr',['女','马'],'女','马','family','mum',1],['姐','jiě','lr',['女','且'],'女','且','family','older sister',1],['妹','mèi','lr',['女','未'],'女','未','family','younger sister',1],['奶','nǎi','lr',['女','乃'],'女','乃','family','grandma',1],['爸','bà','tb',['父','巴'],'父','巴','family','dad',1],['你','nǐ','lr',['亻','尔'],'亻','尔','people','you',1],['他','tā','lr',['亻','也'],'亻','也','people','he',1],['们','men','lr',['亻','门'],'亻','门','people','(plural)',1],['好','hǎo','lr',['女','子'],'女',0,'common','good',1],['吗','ma','lr',['口','马'],'口','马','common','(question word)',1],
['河','hé','lr',['氵','可'],'氵','可','nature','river',2],['海','hǎi','lr',['氵','每'],'氵','每','nature','sea',2],['湖','hú','lr',['氵','胡'],'氵','胡','nature','lake',2],['花','huā','tb',['艹','化'],'艹','化','nature','flower',2],['草','cǎo','tb',['艹','早'],'艹','早','nature','grass',2],['菜','cài','tb',['艹','采'],'艹','采','food','vegetable',2],['树','shù','lr',['木','对'],'木','对','nature','tree',2],['时','shí','lr',['日','寸'],'日','寸','time','time',2],['明','míng','lr',['日','月'],'日',0,'time','bright',2],['校','xiào','lr',['木','交'],'木','交','school','school',2],['汽','qì','lr',['氵','气'],'氵','气','transport','steam',2],
['饭','fàn','lr',['饣','反'],'饣','反','food','rice, meal',3],['饿','è','lr',['饣','我'],'饣','我','food','hungry',3],['饱','bǎo','lr',['饣','包'],'饣','包','food','full',3],['饼','bǐng','lr',['饣','并'],'饣','并','food','cake, biscuit',3],['饺','jiǎo','lr',['饣','交'],'饣','交','food','dumpling',3],['炒','chǎo','lr',['火','少'],'火','少','food','stir-fry',3],['灯','dēng','lr',['火','丁'],'火','丁','things','lamp',3],['打','dǎ','lr',['扌','丁'],'扌','丁','action','hit, play (ball)',3],['拉','lā','lr',['扌','立'],'扌','立','action','pull',3],['提','tí','lr',['扌','是'],'扌','是','action','carry',3],['跑','pǎo','lr',['足','包'],'足','包','action','run',3],['跳','tiào','lr',['足','兆'],'足','兆','action','jump',3],['路','lù','lr',['足','各'],'足','各','transport','road',3],['想','xiǎng','tb',['相','心'],'心','相','action','think, want',3],['忙','máng','lr',['忄','亡'],'忄','亡','feeling','busy',3],['看','kàn','tb',['手','目'],'目',0,'action','look',3],
['狗','gǒu','lr',['犭','句'],'犭','句','animal','dog',4],['猫','māo','lr',['犭','苗'],'犭','苗','animal','cat',4],['猪','zhū','lr',['犭','者'],'犭','者','animal','pig',4],['红','hóng','lr',['纟','工'],'纟','工','colour','red',4],['绿','lǜ','lr',['纟','录'],'纟','录','colour','green',4],['给','gěi','lr',['纟','合'],'纟','合','action','give',4],['纸','zhǐ','lr',['纟','氏'],'纟','氏','things','paper',4],['家','jiā','tb',['宀','豕'],'宀',0,'home','home',4],['室','shì','tb',['宀','至'],'宀','至','home','room',4],['字','zì','tb',['宀','子'],'宀','子','school','character',4],['国','guó','enc',['囗','玉'],'囗',0,'place','country',4],['园','yuán','enc',['囗','元'],'囗','元','place','garden',4],['病','bìng','enc',['疒','丙'],'疒','丙','health','ill',4],['疼','téng','enc',['疒','冬'],'疒','冬','health','aching',4],['钟','zhōng','lr',['钅','中'],'钅','中','things','clock',4],
['请','qǐng','lr',['讠','青'],'讠','青','common','please',5],['情','qíng','lr',['忄','青'],'忄','青','feeling','feeling',5],['晴','qíng','lr',['日','青'],'日','青','nature','clear sky',5],['睛','jīng','lr',['目','青'],'目','青','body','eyeball',5],
['吧','ba','lr',['口','巴'],'口','巴','common','(suggestion word)',6],['呢','ne','lr',['口','尼'],'口','尼','common','(question word)',6],['吵','chǎo','lr',['口','少'],'口','少','action','noisy',6],['汗','hàn','lr',['氵','干'],'氵','干','body','sweat',6],['洗','xǐ','lr',['氵','先'],'氵','先','action','wash',6],['清','qīng','lr',['氵','青'],'氵','青','nature','clear',6],['椅','yǐ','lr',['木','奇'],'木','奇','things','chair',6],['说','shuō','lr',['讠','兑'],'讠','兑','action','speak',6],['读','dú','lr',['讠','卖'],'讠','卖','action','read',6],['语','yǔ','lr',['讠','吾'],'讠','吾','school','language',6],['话','huà','lr',['讠','舌'],'讠',0,'action','words',6]];
export const CHARS=Object.fromEntries(H.map(([c,p,lay,parts,sem,ph,cat,en,u])=>[c,{c,p,lay,parts,sem,ph,cat,en,u}]));

// ---- Whole-shape characters (taught as a shape, no breaking apart). [char, pinyin, gloss, unit] ----
const W=[['老','lǎo','old',1],['师','shī','teacher',1],['学','xué','study',1],['生','shēng','born, student',1],['同','tóng','same',1],['友','yǒu','friend',1],['朋','péng','friend',1],['哥','gē','older brother',1],['弟','dì','younger brother',1],['爷','yé','grandpa',1],['去','qù','go',1],['在','zài','at',1],['的','de','(of)',1],['大','dà','big',1],['小','xiǎo','small',1],['人','rén','person',1],['一','yī','one',1],['书','shū','book',1],['水','shuǐ','water',1],
['天','tiān','sky, day',2],['今','jīn','today',2],['米','mǐ','rice',2],['个','gè','(measure word)',2],['本','běn','(measure word)',2],['张','zhāng','(measure word)',2],['只','zhī','(measure word)',2],['条','tiáo','(measure word)',2],['朵','duǒ','(measure word)',2],['棵','kē','(measure word)',2],['杯','bēi','(measure word)',2],['碗','wǎn','(measure word)',2],['辆','liàng','(measure word)',2],
['球','qiú','ball',3],['步','bù','step',3],['车','chē','vehicle',3],['鱼','yú','fish',3],['鸟','niǎo','bird',3],['喜','xǐ','like',3],['欢','huān','glad',3],['吃','chī','eat',3],['唱','chàng','sing',3],['歌','gē','song',3],
['公','gōng','public',4],['头','tóu','head',4],['色','sè','colour',4],['很','hěn','very',4],['什','shén','what',4],['么','me','(what)',4],['叫','jiào','be called',4],['名','míng','name',4],['高','gāo','tall',4],['兴','xìng','pleased',4],['地','de','(adverb marker)',4],['得','de','(complement marker)',4],['快','kuài','fast',4],['笑','xiào','laugh',4],['她','tā','she',4],['这','zhè','this',4],
['文','wén','writing',6],['做','zuò','do',6],['买','mǎi','buy',6],['写','xiě','write',6],['画','huà','draw',6],['里','lǐ','inside',6],['有','yǒu','have',6],['上','shàng','up',6],['下','xià','down',6],['左','zuǒ','left',6],['右','yòu','right',6],['长','cháng','long',6],['短','duǎn','short',6],['慢','màn','slow',6],['坏','huài','bad',6],['来','lái','come',6],['晚','wǎn','late, evening',6],['冷','lěng','cold',6],['热','rè','hot',6],['多','duō','many',6],['真','zhēn','really',6],['乐','lè','happy',6],['把','bǎ','(measure word)',6],['盏','zhǎn','(measure word)',6],['支','zhī','(measure word)',6],['笔','bǐ','pen',6],['双','shuāng','pair',6],['鞋','xié','shoe',6],['件','jiàn','(measure word)',6],['衣','yī','clothes',6],['服','fú','clothes',6]];
export const WHOLE=Object.fromEntries(W.map(([c,p,en,u])=>[c,{c,p,en,u}]));

// ---- Reading table: character -> toned pinyin (one reading per character; neutral tone has no mark) ----
export const PY={};for(const k in CHARS)PY[k]=CHARS[k].p;for(const k in WHOLE)PY[k]=WHOLE[k].p;for(const k in COMPS)if(COMPS[k].ch&&PY[k]===undefined)PY[k]=COMPS[k].p;
// Homophones and look-alikes a speech engine often returns. Only used to READ heard text; never offered to pupils. A starting guess to calibrate.
export const EXTRA={嘛:'ma',麻:'má',骂:'mà',把:'bǎ',八:'bā',拔:'bá',它:'tā',泥:'ní',拟:'nǐ',号:'hào',和:'hé',何:'hé',荷:'hé',还:'hái',孩:'hái',壶:'hú',华:'huá',画:'huà',话:'huà',才:'cái',蔡:'cài',数:'shù',输:'shū',叔:'shū',够:'gòu',毛:'máo',朱:'zhū',珠:'zhū',洪:'hóng',宏:'hóng',律:'lǜ',虑:'lǜ',砍:'kàn',刊:'kān',迟:'chí',池:'chí',范:'fàn',犯:'fàn',泡:'pào',炮:'pào',加:'jiā',佳:'jiā',果:'guǒ',过:'guò',锅:'guō',功:'gōng',攻:'gōng',圆:'yuán',原:'yuán',源:'yuán',兵:'bīng',清:'qīng',轻:'qīng'};
// Traditional forms of the characters in this bank (Whisper sometimes answers in Traditional). Maps to Simplified.
export const TRAD={媽:'妈',們:'们',嗎:'吗',學:'学',師:'师',飯:'饭',餃:'饺',餅:'饼',餓:'饿',飽:'饱',貓:'猫',豬:'猪',紅:'红',綠:'绿',給:'给',紙:'纸',國:'国',園:'园',時:'时',鐘:'钟',樹:'树',書:'书',請:'请',車:'车',魚:'鱼',鳥:'鸟',頭:'头',個:'个',條:'条',張:'张',隻:'只',輛:'辆',這:'这',麼:'么',歡:'欢',興:'兴',對:'对',號:'号',兒:'儿',報:'报',爺:'爷',歌:'歌',親:'亲',會:'会',點:'点',親:'亲',貴:'贵',問:'问',間:'间',門:'门',開:'开',醫:'医',錢:'钱',鐵:'铁',點:'点',園:'园',員:'员',點:'点'};
export const simp=s=>[...String(s)].map(c=>TRAD[c]||c).join('');
export const toned=ch=>{ch=TRAD[ch]||ch;return PY[ch]!==undefined?PY[ch]:(EXTRA[ch]!==undefined?EXTRA[ch]:null)};

// ---- Phrase pinyin overrides (v0.2). A character has ONE reading in PY, but words have neutral tones (妈妈 māma) and 一 changes tone (一本书 yì běn shū).
// Pinyin shown to children comes from pyChars(), which prefers these phrases (longest match first). The judge ignores tones, so it is unaffected.
export const PYO={'妈妈':['mā','ma'],'爸爸':['bà','ba'],'姐姐':['jiě','jie'],'妹妹':['mèi','mei'],'奶奶':['nǎi','nai'],'爷爷':['yé','ye'],'哥哥':['gē','ge'],'弟弟':['dì','di'],'朋友':['péng','you'],'你们':['nǐ','men'],'他们':['tā','men'],'饺子':['jiǎo','zi'],'学生':['xué','sheng'],'椅子':['yǐ','zi'],'多少':['duō','shao'],'喜欢':['xǐ','huan'],'名字':['míng','zi'],'看看':['kàn','kan'],'想想':['xiǎng','xiang'],'说说':['shuō','shuo'],'看一看':['kàn','yi','kàn'],'洗一洗':['xǐ','yi','xǐ'],'想一想':['xiǎng','yi','xiǎng'],'说一说':['shuō','yi','shuō'],'一本书':['yì','běn','shū'],'一辆汽车':['yí','liàng','qì','chē'],'河里':['hé','li'],'公园里':['gōng','yuán','li']};
const PYK=Object.keys(PYO).sort((a,b)=>[...b].length-[...a].length);
export function pyChars(text){const cs=[...String(text)],out=[];for(let i=0;i<cs.length;){let hit=null;for(const k of PYK){const kk=[...k];if(kk.length<=cs.length-i&&kk.every((c,j)=>cs[i+j]===c)){hit=kk;break}}
 if(hit){out.push(...PYO[hit.join('')]);i+=hit.length}else{out.push(toned(cs[i])||'');i++}}return out}
export const wordPy=w=>pyChars(w).join('');

// ---- Pinyin helpers (shared by browser, Worker and tests) ----
const TONE={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'};
const PLAIN={};for(const b in TONE)[...TONE[b]].forEach((m,i)=>{PLAIN[m]=[b==='ü'?'v':b,i+1]});
export function stripTone(s){let o='',t=0;for(const c of s){if(PLAIN[c]){o+=PLAIN[c][0];t=PLAIN[c][1]}else o+=c==='ü'?'v':c}return{base:o,tone:t||5}}
// One syllable per character. null = a character this table cannot read.
export const sylls=text=>[...text].map(c=>{const p=toned(c);return p===null?null:stripTone(p)});
// A tone mark must sit on the right vowel: a or e first; ou -> o; otherwise the last vowel. At most one mark.
export function toneMarkOk(p){const marks=[...p].filter(c=>PLAIN[c]);if(marks.length>1)return false;if(!marks.length)return true;
 const pl=stripTone(p).base,vs=[...pl].map((c,i)=>'aeiouv'.includes(c)?i:-1).filter(i=>i>=0);if(!vs.length)return false;
 const want=pl.includes('a')?pl.indexOf('a'):pl.includes('e')?pl.indexOf('e'):pl.includes('ou')?pl.indexOf('o'):vs[vs.length-1];
 return [...p].findIndex(c=>PLAIN[c])===want}

// ---- Vocabulary words (词语). [word, category, emoji or '', compound type, gloss] ----
// type: pair (并列), mod (偏正: first part describes the second), vo (动宾: doing + thing), sp (主谓), '' (not taught as a type)
const V=[
['妈妈','family','👩','','mum'],['爸爸','family','👨','','dad'],['姐姐','family','','','older sister'],['妹妹','family','','','younger sister'],['奶奶','family','👵','','grandma'],['爷爷','family','👴','','grandpa'],['哥哥','family','','','older brother'],['弟弟','family','','','younger brother'],
['老师','school','🧑‍🏫','','teacher'],['学生','school','🧑‍🎓','','student'],['同学','school','','','classmate'],['朋友','people','','pair','friend'],['学校','school','🏫','','school'],['你们','people','','','you (plural)'],['他们','people','','','they'],
['河水','nature','','mod','river water'],['大海','nature','🌊','mod','the sea'],['湖水','nature','','mod','lake water'],['花草','nature','🌸','pair','flowers and grass'],['树木','nature','🌳','pair','trees'],['明天','time','','','tomorrow'],['今天','time','','','today'],['晴天','nature','☀️','mod','sunny day'],['小河','nature','','mod','small river'],
['米饭','food','🍚','mod','rice'],['饺子','food','🥟','','dumpling'],['月饼','food','🥮','mod','mooncake'],['炒饭','food','🍳','mod','fried rice'],['青菜','food','🥬','mod','green vegetable'],['吃饭','food','','vo','eat a meal'],['看书','action','📖','vo','read a book'],['打球','action','⚽','vo','play ball'],['跑步','action','🏃','vo','run'],['唱歌','action','🎤','vo','sing'],
['小狗','animal','🐶','mod','puppy'],['小猫','animal','🐱','mod','kitten'],['小鸟','animal','🐦','mod','little bird'],['红灯','things','🔴','mod','red light'],['绿色','colour','🟢','mod','green'],['红色','colour','','mod','red'],['国家','place','','pair','country'],['公园','place','🌳','','park'],['生病','health','🤒','vo','fall ill'],['头疼','health','🤕','sp','headache'],['时钟','things','🕐','mod','clock'],['汽车','transport','🚗','mod','car'],['火车','transport','🚆','mod','train'],['大小','things','','pair','size'],
['大人','people','','mod','adult'],['好人','people','','mod','good person'],['老人','people','👴','mod','old person'],['你好','common','👋','','hello'],
['大树','nature','🌳','mod','big tree'],['大河','nature','','mod','big river'],['小草','nature','🌱','mod','little grass'],['小花','nature','🌼','mod','little flower'],['海水','nature','','mod','sea water'],['天气','nature','🌤️','','weather'],
['饭菜','food','','pair','meals'],['炒菜','food','🍳','vo','stir-fry dishes'],['吃饱','food','','vc','eat until full'],['饭碗','food','🍚','mod','rice bowl'],
['小猪','animal','🐷','mod','piglet'],['大狗','animal','🐕','mod','big dog'],['绿灯','things','🟢','mod','green light'],['家人','family','','mod','family members'],['病人','health','','mod','patient'],['红包','things','🧧','mod','red packet'],['红纸','things','','mod','red paper'],['红花','nature','🌹','mod','red flower'],['绿草','nature','','mod','green grass'],['花园','place','🌷','mod','flower garden'],['想家','action','','vo','miss home'],['跳高','action','','vo','high jump'],
['心情','feeling','','','mood'],
['说话','action','','vo','talk'],['读书','action','📚','vo','study, read'],['写字','action','✍️','vo','write characters'],['洗手','action','🧼','vo','wash hands'],['洗好','action','','vc','finish washing'],['写好','action','','vc','finish writing'],['做好','action','','vc','finish making'],['语文','school','','','Chinese subject'],['椅子','things','','','chair'],['清水','nature','💧','mod','clear water'],['汗水','things','','','sweat'],
['多少','things','','pair','how many'],['上下','things','','pair','up and down'],['左右','things','','pair','left and right'],['长短','things','','pair','length'],['冷热','things','','pair','hot and cold'],['早晚','time','','pair','morning and evening'],['快慢','things','','pair','speed'],['好坏','things','','pair','good and bad'],
['看看','action','','','take a look'],['想想','action','','','think about it'],['说说','action','','','talk about'],['画画','action','🎨','','draw'],['看一看','action','','','take a look'],['洗一洗','action','','','give a wash'],['想一想','action','','','think about it'],['说一说','action','','','say a bit'],['高高兴兴','feeling','😊','','happily'],['快快乐乐','feeling','😄','','happily'],['大大小小','things','','','big and small']];
export const WORDS=V.map(([w,cat,emo,type,en])=>({w,cat,emo,type,en,py:wordPy(w),u:null}));
export const charUnit=c=>CHARS[c]?CHARS[c].u:WHOLE[c]?WHOLE[c].u:COMPS[c]&&COMPS[c].ch?COMPS[c].u:null;
export const unitOf=s=>{let m=0;for(const c of s){const u=charUnit(c);if(u==null)return null;m=Math.max(m,u)}return m};
WORDS.forEach(x=>{x.u=unitOf(x.w)});
export const BYW=Object.fromEntries(WORDS.map(w=>[w.w,w]));

// ---- Compound types, with child-friendly labels ----
export const TYPES={vc:{zh:'补充',en:'result: an action and how it turned out'},pair:{zh:'并列',en:'a pair: two partners that mean alike or go together'},mod:{zh:'偏正',en:'describing: the first part describes the second'},vo:{zh:'动宾',en:'doing: an action and what it is done to'},sp:{zh:'主谓',en:'who + what happens'}};

// ---- Measure words 量词. [noun, ALL accepted measure words, why] ----
const M=[['书',['本'],'books'],['纸',['张'],'flat things'],['猫',['只'],'small animals'],['狗',['只','条'],'animals (both are used)'],['鱼',['条'],'long things'],['鸟',['只'],'small animals'],['河',['条'],'long things'],['花',['朵'],'flowers'],['树',['棵'],'trees'],['水',['杯','碗'],'water in a cup or a bowl (both are used)'],['饭',['碗'],'food in a bowl'],['汽车',['辆'],'vehicles'],['人',['个'],'people (the general one)'],['同学',['个'],'people (the general one)'],['椅子',['把','张'],'chairs (把 is the usual one, 张 is also heard)'],['灯',['盏'],'lamps'],['笔',['支'],'pens and pencils'],['鞋',['双','只'],'a pair is 双, one shoe is 只'],['衣服',['件'],'clothes']];
export const MEASURES=M.map(([n,ok,why])=>({n,ok,why,u:Math.max(unitOf(n),...ok.map(unitOf))}));
export const MEASURE_SET=['个','本','张','只','条','朵','棵','杯','碗','辆','把','盏','支','双','件'];

// ---- Sentences. tiles = chunks in the CORRECT order; orders = EVERY accepted order. Orders not listed are marked "try again". ----
const S=[
[['我们','去','公园'],[],'我们去公园。'],
[['爸爸','在家','看书'],[],'爸爸在家看书。'],
[['妈妈','明天','去','学校'],[['明天','妈妈','去','学校']],'妈妈明天去学校。'],
[['我','想','吃','饺子'],[],'我想吃饺子。'],
[['姐姐','喜欢','小猫'],[],'姐姐喜欢小猫。'],
[['他们','是','我的','同学'],[],'他们是我的同学。'],
[['今天','天气','很','好'],[],'今天天气很好。'],
[['老师','给','我','一本书'],[],'老师给我一本书。'],
[['你','叫','什么','名字'],[],'你叫什么名字？'],
[['你','好','吗'],[],'你好吗？'],
[['小狗','在公园','跑步'],[['在公园','小狗','跑步']],'小狗在公园跑步。'],
[['弟弟','今天','很','忙'],[['今天','弟弟','很','忙']],'弟弟今天很忙。'],
[['我们','去','公园','吧'],[],'我们去公园吧。'],[['妈妈','在家','做饭'],[],'妈妈在家做饭。'],[['姐姐','唱得','很好'],[],'姐姐唱得很好。'],[['今天','很','冷'],[],'今天很冷。'],[['爸爸','买','一辆汽车'],[],'爸爸买一辆汽车。'],[['弟弟','在家','写字'],[],'弟弟在家写字。'],[['小狗','跑得','很快'],[],'小狗跑得很快。'],
[['明天','你','来','学校','吗'],[['你','明天','来','学校','吗']],'明天你来学校吗？'],[['她','高兴地','笑'],[],'她高兴地笑。'],[['我们','在树下','看书'],[],'我们在树下看书。'],[['妹妹','喜欢','红色的花'],[],'妹妹喜欢红色的花。'],[['河里','有','鱼'],[],'河里有鱼。'],[['公园里','有','很多','花'],[],'公园里有很多花。'],
[['爸爸','明天','去','学校'],[['明天','爸爸','去','学校']],'爸爸明天去学校。']];
const strip=t=>t.replace(/[。？]/g,'');
export const SENTS=S.map(([tiles,alts,text],i)=>({id:i,tiles,orders:[tiles,...alts],text,u:unitOf(strip(text)),py:tiles.map(x=>pyChars(x).join('')).join(' ')}));

// ---- 的 / 地 / 得 choose-the-word items. [sentence with ＿ for the gap, answer, reason] ----
const D=[['这是我＿书。','的','shows who owns it'],['小狗跑＿很快。','得','tells HOW WELL, after a verb'],['她高兴＿笑。','地','tells HOW an action is done, before the verb'],['这是红色＿花。','的','joins a describing word to a thing'],['姐姐唱＿很好。','得','tells HOW WELL, after a verb'],['老师高兴＿说话。','地','tells HOW an action is done, before the verb'],['这是小猫＿饭。','的','shows who owns it'],['我们高兴＿去公园。','地','tells HOW an action is done, before the verb'],['弟弟跑＿真快。','得','tells HOW WELL, after a verb']];
export const DDE=D.map(([t,a,why])=>({t,a,why,u:unitOf(t.replace(/[＿。]/g,''))}));

export const UNITS=[null,'Family and people 家人','Nature and time 自然','Food and action 食物','Animals, colours and home 动物','The 青 family 青字家族','Talk and study 说话学习'];
// ---- Opposites 反义词 (v0.2). Every character is in exactly ONE pair, so an item has one right answer. ----
export const OPP=[['大','小'],['快','慢'],['好','坏'],['来','去'],['上','下'],['早','晚'],['冷','热'],['多','少'],['左','右'],['长','短']].map(([a,b])=>({a,b,key:a+b,u:unitOf(a+b)}));
// ---- Reduplication 重叠 (v0.2). [word, pattern, base]. AA, A一A, AABB. ABAB is not included yet (needs more known verbs). ----
export const REDUP=[['看看','AA','看'],['想想','AA','想'],['说说','AA','说'],['画画','AA','画'],['看一看','AyA','看'],['洗一洗','AyA','洗'],['想一想','AyA','想'],['说一说','AyA','说'],['高高兴兴','AABB','高兴'],['快快乐乐','AABB','快乐'],['大大小小','AABB','大小']].map(([w,pat,base])=>({w,pat,base,u:unitOf(w)}));
export const redupForm=(base,pat)=>{const c=[...base];return pat==='AA'?base+base:pat==='AyA'?base+'一'+base:pat==='AABB'?c[0]+c[0]+c[1]+c[1]:pat==='ABAB'?base+base:pat==='AAB'?c[0]+c[0]+c[1]:pat==='ABB'?c[0]+c[1]+c[1]:pat==='AAA'?base+base+base:null};
export const REDNOTE={AA:'Repeating a verb: do it a little, have a go.',AyA:'A一A: try it, have a go.',AABB:'Repeating both parts makes the word lively.'};
// ---- Stroke count: the sum of the strokes of the parts (checked against known counts in tests) ----
export const strokes=c=>CHARS[c]?CHARS[c].parts.reduce((n,p)=>n+COMPS[p].s,0):null;
// Say-it items: a word or a sentence.
export const SAYABLE=[...WORDS.map(w=>({k:'w',key:w.w,text:w.w,u:w.u})),...SENTS.map(s=>({k:'s',key:String(s.id),text:strip(s.text),u:s.u}))];
export const sayItem=(k,key)=>SAYABLE.find(x=>x.k===k&&x.key===String(key));
export const UNIT_ITEMS=u=>({chars:Object.values(CHARS).filter(c=>c.u===u),words:WORDS.filter(w=>w.u===u),sents:SENTS.filter(s=>s.u===u)});
export default {PYO,pyChars,wordPy,OPP,REDUP,redupForm,REDNOTE,strokes,TRAD,simp,COMPS,CHARS,WHOLE,PY,EXTRA,toned,stripTone,sylls,toneMarkOk,WORDS,BYW,TYPES,MEASURES,MEASURE_SET,SENTS,DDE,UNITS,SAYABLE,sayItem,UNIT_ITEMS,charUnit,unitOf};
