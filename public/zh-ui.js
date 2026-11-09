// Mandarin Say It! pinyin for the app's OWN Chinese (buttons, instructions, praise), so a child can read them aloud.
// Never used on lesson content: characters and words being taught go through chars() in app.js, which follows the class pinyin setting.
// Only whole phrases listed here get pinyin; anything else is left alone, so a lesson word can never pick up pinyin by accident.
// Reading rules used: 一 is yí before a 4th tone and yì before 1st-3rd; light in A一A (dú yi dú); neutral tones are written without a mark.
export const UIPY={
 '讲华语':'jiǎng huáyǔ','拼音':'pīnyīn','部首':'bùshǒu','意思':'yìsi','夜市':'yèshì','开始':'kāishǐ','开始玩':'kāishǐ wán','你好':'nǐ hǎo','好棒':'hǎo bàng','好':'hǎo',
 '下一个':'xià yí gè','下一步':'xià yí bù','返回':'fǎnhuí','听':'tīng','回家':'huíjiā','检查':'jiǎnchá','拼':'pīn','读':'dú','它是':'tā shì',
 '新同学':'xīn tóngxué','新的':'xīn de','客人试玩':'kèrén shìwán','加入':'jiārù','加入班级':'jiārù bānjí','选一个名字':'xuǎn yí gè míngzi',
 '用名字或昵称':'yòng míngzi huò nìchēng','你现在是客人':'nǐ xiànzài shì kèrén','老师':'lǎoshī',
 '这是什么':'zhè shì shénme','哪个拼音对':'nǎge pīnyīn duì','哪一部分表示意思':'nǎ yí bùfen biǎoshì yìsi','哪一个不一样':'nǎ yí gè bù yíyàng','反义词是哪个':'fǎnyìcí shì nǎge',
 '听一听':'tīng yi tīng','是哪个词':'shì nǎge cí','读一读':'dú yi dú','大声读':'dàshēng dú','把词语排好':'bǎ cíyǔ páihǎo','选量词':'xuǎn liàngcí','把字拼起来':'bǎ zì pīn qǐlai',
 '一共几画':'yígòng jǐ huà','这个词是什么重叠':'zhège cí shì shénme chóngdié','这个词怎么组成':'zhège cí zěnme zǔchéng','哪个字也有':'nǎge zì yě yǒu','点出所有有':'diǎn chū suǒyǒu yǒu','哪个是':'nǎge shì','都有':'dōu yǒu','的字':'de zì','画':'huà',
 '没关系':'méi guānxi','差不多':'chàbuduō','再试一试':'zài shì yi shì','再听一听':'zài tīng yi tīng','休息一下':'xiūxi yíxià','今天到这里':'jīntiān dào zhèlǐ','个好答案':'gè hǎo dá’àn','声旁只是线索':'shēngpáng zhǐshì xiànsuǒ',
 '复习':'fùxí','练习':'liànxí','大约十二分钟':'dàyuē shí’èr fēnzhōng','的 地 得':'de dì de','选一个':'xuǎn yí gè',
 '看一看':'kàn yi kàn','哪一个':'nǎ yí gè','单元':'dānyuán','字':'zì','词':'cí','我会的字':'wǒ huì de zì','全部部首':'quánbù bùshǒu','带这个部分的字':'dài zhège bùfen de zì','点你的图片':'diǎn nǐ de túpiàn','选三张图':'xuǎn sān zhāng tú','我记住了':'wǒ jìzhù le','换一个班':'huàn yí gè bān','用名字':'yòng míngzi','图片登录':'túpiàn dēnglù',
 '家人':'jiārén','自然':'zìrán','食物':'shíwù','动物':'dòngwù','青字家族':'qīngzì jiāzú','说话学习':'shuōhuà xuéxí','地方出行':'dìfang chūxíng','自然食物':'zìrán shíwù','时间衣物玩乐':'shíjiān yīwù wánlè'};
const KEYS=Object.keys(UIPY).sort((a,b)=>[...b].length-[...a].length);
const CJK=/[㐀-鿿]/;
// Pure: split a string into [{t:'text'}|{t:'Chinese phrase',py:'pinyin'}] pieces, longest phrase first.
export function segments(str,tbl=UIPY,keys=KEYS){const cs=[...String(str)],out=[];let buf='',i=0;
 while(i<cs.length){let hit=null;if(CJK.test(cs[i])||cs[i]==='的'){for(const k of keys){const kk=[...k];if(kk.every((c,j)=>cs[i+j]===c)){hit=kk;break}}}
  if(hit){if(buf){out.push({t:buf});buf=''}out.push({t:hit.join(''),py:tbl[hit.join('')]});i+=hit.length}else{buf+=cs[i];i++}}
 if(buf)out.push({t:buf});return out}
// Browser: the same pieces as text nodes and <ruby> elements.
export function T(str,pinyin=true){if(!pinyin)return[String(str)];return segments(str).map(p=>{if(!p.py)return p.t;const r=document.createElement('ruby');r.append(p.t);const rt=document.createElement('rt');rt.textContent=p.py;r.append(rt);return r})}
export default {UIPY,segments,T};
