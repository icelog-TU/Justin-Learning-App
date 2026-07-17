export interface ConfusableChar {
  char: string;
  usage: string;
  sample: string;
}

export interface ConfusableGroup {
  id: string;
  title: string;
  tip: string;
  chars: ConfusableChar[];
}

export interface ConfusableQuestion {
  id: string;
  groupId: string;
  sentence: string; // contains "___" as the blank
  options: string[];
  answer: string;
  explanation: string;
}

export const confusableGroups: ConfusableGroup[] = [
  {
    id: 'zai-zai',
    title: '在／再',
    tip: '「在」和位置、地方有關；「再」表示重複一次或「以後」。',
    chars: [
      { char: '在', usage: '表示人事物存在的位置，或正在進行某個動作', sample: '在家、正在' },
      { char: '再', usage: '表示「又一次」或「以後」，用在動作之前', sample: '再見、再來一次' },
    ],
  },
  {
    id: 'de-de-de',
    title: '的／得／地',
    tip: '「的」接在名詞前面；「得」接在動詞後面說明做得怎麼樣；「地」接在動詞前面說明怎麼做。',
    chars: [
      { char: '的', usage: '用在名詞前面的修飾語', sample: '漂亮的花' },
      { char: '得', usage: '用在動詞後面，說明程度或結果', sample: '跑得快' },
      { char: '地', usage: '用在動詞前面，說明做動作的樣子', sample: '慢慢地走' },
    ],
  },
  {
    id: 'zuo-zuo',
    title: '做／作',
    tip: '具體的動作用「做」；比較抽象或書面的詞語用「作」，可搭配固定詞語多記憶。',
    chars: [
      { char: '做', usage: '具體的動作', sample: '做功課、做家事' },
      { char: '作', usage: '比較抽象或書面用語', sample: '作文、工作' },
    ],
  },
  {
    id: 'dai-dai',
    title: '戴／帶',
    tip: '「戴」的東西通常穿戴在身上（頭、手、臉）；「帶」的東西是拿著、帶著走。',
    chars: [
      { char: '戴', usage: '穿戴在身上', sample: '戴帽子、戴眼鏡' },
      { char: '帶', usage: '攜帶、帶領', sample: '帶書包、帶路' },
    ],
  },
  {
    id: 'xiang-xiang',
    title: '象／像',
    tip: '動物大象用「象」；表示相似或圖像用「像」。',
    chars: [
      { char: '象', usage: '動物名稱，也指現象', sample: '大象、氣象' },
      { char: '像', usage: '相似、圖像', sample: '好像、人像' },
    ],
  },
  {
    id: 'ji-ji',
    title: '即／既',
    tip: '「既然」表示已經如此；「即使」表示假設的情況。',
    chars: [
      { char: '即', usage: '就是、立刻，用於假設', sample: '即使、一觸即發' },
      { char: '既', usage: '已經，用於既定事實', sample: '既然如此' },
    ],
  },
  {
    id: 'pei-pei',
    title: '陪／賠',
    tip: '「陪」是跟著、陪伴的意思；「賠」是因為損失而還錢的意思。',
    chars: [
      { char: '陪', usage: '陪伴', sample: '陪伴、陪讀' },
      { char: '賠', usage: '賠償', sample: '賠錢、賠不是' },
    ],
  },
  {
    id: 'ji-yi',
    title: '己／已',
    tip: '「己」中間是封口的（自己）；「已」中間不封口、有缺口（已經）。',
    chars: [
      { char: '己', usage: '自己', sample: '自己、知己' },
      { char: '已', usage: '已經', sample: '已經、已完成' },
    ],
  },
  {
    id: 'mai-mai',
    title: '買／賣',
    tip: '「買」是花錢拿東西；「賣」是收錢給東西，兩者方向相反。',
    chars: [
      { char: '買', usage: '用錢換東西', sample: '購買、買菜' },
      { char: '賣', usage: '把東西給別人換錢', sample: '販賣、賣水果' },
    ],
  },
  {
    id: 'she-she',
    title: '舍／捨',
    tip: '「舍」是名詞，指房子；「捨」是動詞，指放下、給予。',
    chars: [
      { char: '舍', usage: '房屋', sample: '宿舍、校舍' },
      { char: '捨', usage: '捨得、捨棄', sample: '依依不捨' },
    ],
  },
  {
    id: 'jin-jin',
    title: '進／近',
    tip: '「進」是動作，表示向前移動；「近」是形容詞，表示距離短。',
    chars: [
      { char: '進', usage: '向前移動', sample: '前進、進去' },
      { char: '近', usage: '距離短', sample: '附近、接近' },
    ],
  },
  {
    id: 'fan-fan',
    title: '反／返',
    tip: '「反」表示相反的方向或意見；「返」表示回去、回來。',
    chars: [
      { char: '反', usage: '相反、翻轉', sample: '相反、反對' },
      { char: '返', usage: '回來', sample: '返回、往返' },
    ],
  },
  {
    id: 'cai-cai-cai',
    title: '採／彩／踩',
    tip: '「採」用手摘東西；「彩」跟顏色、精采有關；「踩」用腳踏在東西上。',
    chars: [
      { char: '採', usage: '摘取、蒐集', sample: '採花、採訪' },
      { char: '彩', usage: '顏色鮮豔、精采', sample: '色彩、精彩' },
      { char: '踩', usage: '用腳踏', sample: '踩到、踩水' },
    ],
  },
  {
    id: 'wei-mo',
    title: '未／末',
    tip: '「未」表示還沒有；「末」表示最後、末端，可用「最上面一橫的長短」幫助記憶。',
    chars: [
      { char: '未', usage: '還沒有', sample: '未來、未必' },
      { char: '末', usage: '最後、末端', sample: '週末、期末' },
    ],
  },
  {
    id: 'bian-bian-ban-ban',
    title: '辨／辯／辦／瓣',
    tip: '中間部件不同：辨是「刀」，辯是「言」，辦是兩點，瓣是「瓜」。',
    chars: [
      { char: '辨', usage: '分辨、辨別', sample: '辨別、明辨' },
      { char: '辯', usage: '辯論、爭辯', sample: '辯論、爭辯' },
      { char: '辦', usage: '辦理、舉辦', sample: '辦理、舉辦' },
      { char: '瓣', usage: '花瓣', sample: '花瓣、豆瓣' },
    ],
  },
  {
    id: 'miao-miao',
    title: '秒／妙',
    tip: '「秒」是禾部，和時間有關；「妙」是女部，形容美好巧妙。',
    chars: [
      { char: '秒', usage: '時間單位', sample: '分秒、秒針' },
      { char: '妙', usage: '美好、巧妙', sample: '奇妙、巧妙' },
    ],
  },
  {
    id: 'qing-family',
    title: '睛／晴／清／請／情（青字家族）',
    tip: '都念「ㄑㄧㄥ」，靠部首分辨意思：目部跟眼睛有關，日部跟天氣有關，水部跟水有關，言部跟說話有關，心部跟心情有關。',
    chars: [
      { char: '睛', usage: '眼睛（目部）', sample: '眼睛、畫龍點睛' },
      { char: '晴', usage: '晴天（日部）', sample: '晴天、晴朗' },
      { char: '清', usage: '清水（水部）', sample: '清水、清楚' },
      { char: '請', usage: '請問（言部）', sample: '請問、邀請' },
      { char: '情', usage: '心情（心部）', sample: '心情、感情' },
    ],
  },
  {
    id: 'huan-huan',
    title: '換／喚',
    tip: '「換」是提手部，跟用手交換東西有關；「喚」是口部，跟用嘴巴叫人有關。',
    chars: [
      { char: '換', usage: '交換、更換', sample: '換衣服、交換' },
      { char: '喚', usage: '呼喚、叫喚', sample: '呼喚、召喚' },
    ],
  },
  {
    id: 'zao-family',
    title: '燥／躁／操（喿字家族）',
    tip: '「燥」跟火、乾燥有關；「躁」跟腳、情緒不安有關；「操」跟手、動作有關。',
    chars: [
      { char: '燥', usage: '乾燥（火部）', sample: '乾燥、乾燥機' },
      { char: '躁', usage: '急躁（足部）', sample: '急躁、暴躁' },
      { char: '操', usage: '操場、操作（手部）', sample: '操場、體操' },
    ],
  },
  {
    id: 'guan-guan',
    title: '貫／慣',
    tip: '「慣」多了一個「心」部，因為習慣跟心理、行為有關。',
    chars: [
      { char: '貫', usage: '貫穿、連貫', sample: '貫穿、魚貫而入' },
      { char: '慣', usage: '習慣', sample: '習慣、慣例' },
    ],
  },
  {
    id: 'yi-yi',
    title: '已／以',
    tip: '「已」用來表示「已經發生」；「以」常搭配組成「以為、可以、以後」等詞。',
    chars: [
      { char: '已', usage: '已經', sample: '已經、已完成' },
      { char: '以', usage: '以為、可以', sample: '以為、以後' },
    ],
  },
  {
    id: 'yuan-yuan',
    title: '圓／園',
    tip: '「圓」跟形狀有關；「園」是有圍牆、種植花草的地方。',
    chars: [
      { char: '圓', usage: '圓形', sample: '圓圈、湯圓' },
      { char: '園', usage: '花園、公園', sample: '花園、公園' },
    ],
  },
  {
    id: 'yao-family',
    title: '燒／繞／饒（堯字家族）',
    tip: '「燒」跟火有關；「繞」跟線、圈有關；「饒」跟寬恕、原諒有關。',
    chars: [
      { char: '燒', usage: '燃燒（火部）', sample: '燃燒、燒烤' },
      { char: '繞', usage: '繞圈、圍繞（糸部）', sample: '圍繞、繞路' },
      { char: '饒', usage: '饒恕（食部）', sample: '饒恕、求饒' },
    ],
  },
  {
    id: 'pi-family',
    title: '波／坡／婆／破（皮字家族）',
    tip: '「波」跟水有關；「坡」跟地形有關；「婆」跟人有關；「破」跟毀壞、破裂有關。',
    chars: [
      { char: '波', usage: '波浪（水部）', sample: '波浪、波紋' },
      { char: '坡', usage: '山坡（土部）', sample: '山坡、斜坡' },
      { char: '婆', usage: '婆婆（女部）', sample: '婆婆、外婆' },
      { char: '破', usage: '破壞（石部）', sample: '破壞、打破' },
    ],
  },
  {
    id: 'jiao-family',
    title: '教／較／校／郊（交字家族）',
    tip: '「教」跟教導有關；「較」跟比較、車輛有關；「校」跟學校、木材有關；「郊」跟郊外、地方有關。',
    chars: [
      { char: '教', usage: '教導（攵部）', sample: '教書、教導' },
      { char: '較', usage: '比較（車部）', sample: '比較、較量' },
      { char: '校', usage: '學校（木部）', sample: '學校、校園' },
      { char: '郊', usage: '郊外（邑部）', sample: '郊外、郊遊' },
    ],
  },
  {
    id: 'bao-family',
    title: '抱／跑／泡／飽（包字家族）',
    tip: '「抱」跟手的動作有關；「跑」跟腳的動作有關；「泡」跟水有關；「飽」跟吃東西有關。',
    chars: [
      { char: '抱', usage: '擁抱（手部）', sample: '擁抱、抱住' },
      { char: '跑', usage: '跑步（足部）', sample: '跑步、賽跑' },
      { char: '泡', usage: '泡泡（水部）', sample: '泡泡、泡茶' },
      { char: '飽', usage: '吃飽（食部）', sample: '吃飽、飽足' },
    ],
  },
  {
    id: 'sheng-family',
    title: '星／姓／性（生字家族）',
    tip: '「星」跟天空、天體有關；「姓」跟人的姓氏有關；「性」跟心理、個性有關。',
    chars: [
      { char: '星', usage: '星星（日部）', sample: '星星、星空' },
      { char: '姓', usage: '姓氏（女部）', sample: '姓名、姓氏' },
      { char: '性', usage: '個性（心部）', sample: '個性、性格' },
    ],
  },
  {
    id: 'ta-ta-ta',
    title: '他／她／它',
    tip: '依照所指對象是男生、女生，還是動物、物品，選用不同的字。',
    chars: [
      { char: '他', usage: '指男性', sample: '他是我哥哥' },
      { char: '她', usage: '指女性', sample: '她是我姊姊' },
      { char: '它', usage: '指動物或事物', sample: '它是一隻小狗' },
    ],
  },
  {
    id: 'mang-wang',
    title: '忙／忘',
    tip: '「忙」的部件排列是「忄＋亡」；「忘」是「亡＋心」上下排列，容易寫反，要注意筆順。',
    chars: [
      { char: '忙', usage: '忙碌', sample: '忙碌、幫忙' },
      { char: '忘', usage: '忘記', sample: '忘記、遺忘' },
    ],
  },
  {
    id: 'shao-family',
    title: '抄／沙／吵（少字家族）',
    tip: '「抄」跟手的動作有關；「沙」跟水、沙灘有關；「吵」跟嘴巴、聲音有關。',
    chars: [
      { char: '抄', usage: '抄寫（手部）', sample: '抄寫、抄錄' },
      { char: '沙', usage: '沙子（水部）', sample: '沙灘、沙子' },
      { char: '吵', usage: '吵鬧（口部）', sample: '吵架、吵鬧' },
    ],
  },
  {
    id: 'tong-family',
    title: '洞／同／銅（同字家族）',
    tip: '「洞」跟坑洞、水有關；「同」表示一樣；「銅」跟金屬有關。',
    chars: [
      { char: '洞', usage: '山洞（水部）', sample: '山洞、洞穴' },
      { char: '同', usage: '相同', sample: '相同、同學' },
      { char: '銅', usage: '銅板（金部）', sample: '銅板、銅像' },
    ],
  },
  {
    id: 'he-family',
    title: '河／何／荷（可字家族）',
    tip: '「河」跟水有關；「何」常用來表示疑問，如「如何、為何」；「荷」跟植物有關。',
    chars: [
      { char: '河', usage: '河流（水部）', sample: '河流、河水' },
      { char: '何', usage: '如何、為何（人部）', sample: '如何、任何' },
      { char: '荷', usage: '荷花（草部）', sample: '荷花、荷葉' },
    ],
  },
  {
    id: 'miao-family',
    title: '苗／描／瞄（苗字家族）',
    tip: '「苗」跟植物有關；「描」跟用手畫、寫有關；「瞄」跟眼睛、瞄準有關。',
    chars: [
      { char: '苗', usage: '禾苗（草部）', sample: '禾苗、樹苗' },
      { char: '描', usage: '描寫（手部）', sample: '描寫、描繪' },
      { char: '瞄', usage: '瞄準（目部）', sample: '瞄準、瞄一眼' },
    ],
  },
  {
    id: 'ge-family',
    title: '各／客／格／落（各字家族）',
    tip: '「客」跟人有關（房子裡的人）；「格」跟木頭、格子有關；「落」跟掉下、植物凋落有關。',
    chars: [
      { char: '各', usage: '各自、各種', sample: '各自、各種' },
      { char: '客', usage: '客人（宀部）', sample: '客人、客廳' },
      { char: '格', usage: '格子（木部）', sample: '格子、性格' },
      { char: '落', usage: '落下（草部）', sample: '落下、掉落' },
    ],
  },
  {
    id: 'ling-family',
    title: '令／今／冷／鈴（令字家族）',
    tip: '「冷」跟天氣、溫度有關；「鈴」跟金屬、聲音有關；「今」表示現在這個時候。',
    chars: [
      { char: '令', usage: '命令', sample: '命令、口令' },
      { char: '今', usage: '今天', sample: '今天、今年' },
      { char: '冷', usage: '寒冷（冫部）', sample: '寒冷、冷氣' },
      { char: '鈴', usage: '鈴聲（金部）', sample: '鈴聲、風鈴' },
    ],
  },
  {
    id: 'xiang-family',
    title: '相／箱／想／霜（相字家族）',
    tip: '「箱」跟竹、木製的容器有關；「想」跟心裡想念、思考有關；「霜」跟天氣、寒冷有關。',
    chars: [
      { char: '相', usage: '互相', sample: '互相、相同' },
      { char: '箱', usage: '箱子（竹部）', sample: '箱子、書箱' },
      { char: '想', usage: '想念（心部）', sample: '想念、想法' },
      { char: '霜', usage: '冰霜（雨部）', sample: '冰霜、霜淇淋' },
    ],
  },
  {
    id: 'zhu-family',
    title: '主／住／注／柱（主字家族）',
    tip: '「住」跟人的居住有關；「注」跟水、專注有關；「柱」跟木頭、支撐有關。',
    chars: [
      { char: '主', usage: '主人', sample: '主人、主意' },
      { char: '住', usage: '居住（人部）', sample: '居住、住址' },
      { char: '注', usage: '注意（水部）', sample: '注意、注水' },
      { char: '柱', usage: '柱子（木部）', sample: '柱子、支柱' },
    ],
  },
];

export const confusableQuestions: ConfusableQuestion[] = [
  { id: 'zai-zai-1', groupId: 'zai-zai', sentence: '妹妹___教室裡寫功課。', options: ['在', '再'], answer: '在', explanation: '表示「位置」，所以用「在」。' },
  { id: 'zai-zai-2', groupId: 'zai-zai', sentence: '這次沒做好，我們下次___試一次看看。', options: ['在', '再'], answer: '再', explanation: '表示「又一次」，所以用「再」。' },

  { id: 'de-de-de-1', groupId: 'de-de-de', sentence: '這是一朵美麗___花。', options: ['的', '得', '地'], answer: '的', explanation: '「的」用在名詞「花」前面，是修飾語。' },
  { id: 'de-de-de-2', groupId: 'de-de-de', sentence: '他跑___非常快，得到了第一名。', options: ['的', '得', '地'], answer: '得', explanation: '「得」接在動詞「跑」後面，說明跑的程度。' },
  { id: 'de-de-de-3', groupId: 'de-de-de', sentence: '小狗開心___搖著尾巴。', options: ['的', '得', '地'], answer: '地', explanation: '「地」接在動詞「搖」前面，說明怎麼搖。' },

  { id: 'zuo-zuo-1', groupId: 'zuo-zuo', sentence: '放學後，我先___功課再玩。', options: ['做', '作'], answer: '做', explanation: '「做功課」是具體的動作，用「做」。' },
  { id: 'zuo-zuo-2', groupId: 'zuo-zuo', sentence: '老師今天出了一篇___文的題目。', options: ['做', '作'], answer: '作', explanation: '「作文」是固定的書面用語，用「作」。' },

  { id: 'dai-dai-1', groupId: 'dai-dai', sentence: '出門前，爺爺___上了他心愛的帽子。', options: ['戴', '帶'], answer: '戴', explanation: '帽子是戴在頭上的，用「戴」。' },
  { id: 'dai-dai-2', groupId: 'dai-dai', sentence: '媽媽提醒我要___雨傘去上學。', options: ['戴', '帶'], answer: '帶', explanation: '雨傘是拿著、攜帶的，用「帶」。' },

  { id: 'xiang-xiang-1', groupId: 'xiang-xiang', sentence: '動物園裡有一隻很大的大___。', options: ['象', '像'], answer: '象', explanation: '大象是動物名稱，用「象」。' },
  { id: 'xiang-xiang-2', groupId: 'xiang-xiang', sentence: '妹妹長得很___媽媽。', options: ['象', '像'], answer: '像', explanation: '表示相似，用「像」。' },

  { id: 'ji-ji-1', groupId: 'ji-ji', sentence: '___然天氣不好，我們就改天再去吧。', options: ['即', '既'], answer: '既', explanation: '「既然」表示已經如此的事實。' },
  { id: 'ji-ji-2', groupId: 'ji-ji', sentence: '___使下雨，運動會還是照常舉行。', options: ['即', '既'], answer: '即', explanation: '「即使」表示假設的情況。' },

  { id: 'pei-pei-1', groupId: 'pei-pei', sentence: '媽媽每天___我一起讀故事書。', options: ['陪', '賠'], answer: '陪', explanation: '陪伴的意思，用「陪」。' },
  { id: 'pei-pei-2', groupId: 'pei-pei', sentence: '他不小心打破花瓶，只好___錢給老闆。', options: ['陪', '賠'], answer: '賠', explanation: '因損失而還錢，用「賠」。' },

  { id: 'ji-yi-1', groupId: 'ji-yi', sentence: '這件事要靠自___的努力才能完成。', options: ['己', '已'], answer: '己', explanation: '「自己」的「己」中間是封口的。' },
  { id: 'ji-yi-2', groupId: 'ji-yi', sentence: '我___經把作業寫完了。', options: ['己', '已'], answer: '已', explanation: '「已經」的「已」中間不封口。' },

  { id: 'mai-mai-1', groupId: 'mai-mai', sentence: '媽媽去市場___了一些青菜。', options: ['買', '賣'], answer: '買', explanation: '花錢拿東西，用「買」。' },
  { id: 'mai-mai-2', groupId: 'mai-mai', sentence: '這家店專門___水果和蔬菜。', options: ['買', '賣'], answer: '賣', explanation: '把東西給別人換錢，用「賣」。' },

  { id: 'she-she-1', groupId: 'she-she', sentence: '學校旁邊蓋了一棟新的宿___。', options: ['舍', '捨'], answer: '舍', explanation: '「宿舍」是房屋，用「舍」。' },
  { id: 'she-she-2', groupId: 'she-she', sentence: '畢業的時候，大家都依依不___。', options: ['舍', '捨'], answer: '捨', explanation: '「捨不得」是動詞，用「捨」。' },

  { id: 'jin-jin-1', groupId: 'jin-jin', sentence: '上課鈴響了，同學們趕緊___教室。', options: ['進', '近'], answer: '進', explanation: '向前移動，用「進」。' },
  { id: 'jin-jin-2', groupId: 'jin-jin', sentence: '我家離學校很___，走路五分鐘就到了。', options: ['進', '近'], answer: '近', explanation: '距離短，用「近」。' },

  { id: 'fan-fan-1', groupId: 'fan-fan', sentence: '他的意見和大家___而行，很少人贊成。', options: ['反', '返'], answer: '反', explanation: '「相反」的意思，用「反」。' },
  { id: 'fan-fan-2', groupId: 'fan-fan', sentence: '郊遊結束後，遊覽車載我們___回學校。', options: ['反', '返'], answer: '返', explanation: '回去、回來，用「返」。' },

  { id: 'cai-cai-cai-1', groupId: 'cai-cai-cai', sentence: '農夫在果園裡___水果。', options: ['採', '彩', '踩'], answer: '採', explanation: '用手摘取，用「採」。' },
  { id: 'cai-cai-cai-2', groupId: 'cai-cai-cai', sentence: '這場表演真是太精___了。', options: ['採', '彩', '踩'], answer: '彩', explanation: '「精彩」跟顏色、精采有關，用「彩」。' },
  { id: 'cai-cai-cai-3', groupId: 'cai-cai-cai', sentence: '小心不要___到地上的積水。', options: ['採', '彩', '踩'], answer: '踩', explanation: '用腳踏，用「踩」。' },

  { id: 'wei-mo-1', groupId: 'wei-mo', sentence: '這件事情的結果現在還___知。', options: ['未', '末'], answer: '未', explanation: '「未知」表示還沒有，用「未」。' },
  { id: 'wei-mo-2', groupId: 'wei-mo', sentence: '我們一家人常常在週___去爬山。', options: ['未', '末'], answer: '末', explanation: '「週末」表示一週的最後，用「末」。' },

  { id: 'bian-bian-ban-ban-1', groupId: 'bian-bian-ban-ban', sentence: '這兩種顏色很相近，要仔細才能___別。', options: ['辨', '辯', '辦', '瓣'], answer: '辨', explanation: '「辨別」的「辨」中間是「刀」。' },
  { id: 'bian-bian-ban-ban-2', groupId: 'bian-bian-ban-ban', sentence: '學校下星期要舉___運動會。', options: ['辨', '辯', '辦', '瓣'], answer: '辦', explanation: '「舉辦」的「辦」兩旁是兩點。' },
  { id: 'bian-bian-ban-ban-3', groupId: 'bian-bian-ban-ban', sentence: '這朵花有五片花___。', options: ['辨', '辯', '辦', '瓣'], answer: '瓣', explanation: '「花瓣」的「瓣」中間是「瓜」。' },

  { id: 'miao-miao-1', groupId: 'miao-miao', sentence: '一分鐘等於六十___。', options: ['秒', '妙'], answer: '秒', explanation: '時間單位，用「秒」（禾部）。' },
  { id: 'miao-miao-2', groupId: 'miao-miao', sentence: '這個魔術實在太巧___了！', options: ['秒', '妙'], answer: '妙', explanation: '形容美好巧妙，用「妙」（女部）。' },

  { id: 'qing-family-1', groupId: 'qing-family', sentence: '妹妹的眼___又大又亮。', options: ['睛', '晴', '清', '請', '情'], answer: '睛', explanation: '「眼睛」跟眼睛有關，用目部的「睛」。' },
  { id: 'qing-family-2', groupId: 'qing-family', sentence: '今天天氣很___朗，適合出門玩。', options: ['睛', '晴', '清', '請', '情'], answer: '晴', explanation: '「晴朗」跟天氣有關，用日部的「晴」。' },
  { id: 'qing-family-3', groupId: 'qing-family', sentence: '___問這一題應該怎麼算？', options: ['睛', '晴', '清', '請', '情'], answer: '請', explanation: '「請問」跟說話有關，用言部的「請」。' },

  { id: 'huan-huan-1', groupId: 'huan-huan', sentence: '天氣變冷了，該___上厚一點的外套了。', options: ['換', '喚'], answer: '換', explanation: '交換、更換衣物，用提手部的「換」。' },
  { id: 'huan-huan-2', groupId: 'huan-huan', sentence: '媽媽在門口大聲呼___我回家吃飯。', options: ['換', '喚'], answer: '喚', explanation: '用嘴巴叫人，用口部的「喚」。' },

  { id: 'zao-family-1', groupId: 'zao-family', sentence: '天氣太乾___了，記得多喝水。', options: ['燥', '躁', '操'], answer: '燥', explanation: '「乾燥」跟火、乾有關，用「燥」。' },
  { id: 'zao-family-2', groupId: 'zao-family', sentence: '遇到困難不要急___，慢慢想辦法解決。', options: ['燥', '躁', '操'], answer: '躁', explanation: '「急躁」跟情緒不安有關，用「躁」。' },
  { id: 'zao-family-3', groupId: 'zao-family', sentence: '下課後，同學們在___場上跑步。', options: ['燥', '躁', '操'], answer: '操', explanation: '「操場」跟活動、場地有關，用「操」。' },

  { id: 'guan-guan-1', groupId: 'guan-guan', sentence: '這條隧道貫___了整座山。', options: ['貫', '慣'], answer: '貫', explanation: '「貫穿」表示穿過，用「貫」。' },
  { id: 'guan-guan-2', groupId: 'guan-guan', sentence: '早睡早起是很好的生活習___。', options: ['貫', '慣'], answer: '慣', explanation: '「習慣」跟心理、行為有關，用「慣」。' },

  { id: 'yi-yi-1', groupId: 'yi-yi', sentence: '現在時間___經很晚了，快去睡覺吧。', options: ['已', '以'], answer: '已', explanation: '「已經」表示事情已經發生，用「已」。' },
  { id: 'yi-yi-2', groupId: 'yi-yi', sentence: '我原本___為今天不用上課。', options: ['已', '以'], answer: '以', explanation: '「以為」是固定用語，用「以」。' },

  { id: 'yuan-yuan-1', groupId: 'yuan-yuan', sentence: '這個盤子是___形的。', options: ['圓', '園'], answer: '圓', explanation: '形狀用「圓」。' },
  { id: 'yuan-yuan-2', groupId: 'yuan-yuan', sentence: '假日我們常常去公___散步。', options: ['圓', '園'], answer: '園', explanation: '公園是地方，用「園」。' },

  { id: 'yao-family-1', groupId: 'yao-family', sentence: '營火晚會時，大家圍著火堆唱歌，火堆熊熊___著。', options: ['燒', '繞', '饒'], answer: '燒', explanation: '跟火有關，用「燒」。' },
  { id: 'yao-family-2', groupId: 'yao-family', sentence: '操場旁的小路彎彎___繞的。', options: ['燒', '繞', '饒'], answer: '繞', explanation: '跟線、圈有關，用「繞」。' },

  { id: 'pi-family-1', groupId: 'pi-family', sentence: '海邊的___浪一波接著一波。', options: ['波', '坡', '婆', '破'], answer: '波', explanation: '跟水有關，用「波」。' },
  { id: 'pi-family-2', groupId: 'pi-family', sentence: '這座山___很陡，爬起來很累。', options: ['波', '坡', '婆', '破'], answer: '坡', explanation: '跟地形有關，用「坡」。' },
  { id: 'pi-family-3', groupId: 'pi-family', sentence: '這個杯子不小心被打___了。', options: ['波', '坡', '婆', '破'], answer: '破', explanation: '跟毀壞、破裂有關，用「破」。' },

  { id: 'jiao-family-1', groupId: 'jiao-family', sentence: '老師耐心地___我們算數學。', options: ['教', '較', '校', '郊'], answer: '教', explanation: '跟教導有關，用「教」。' },
  { id: 'jiao-family-2', groupId: 'jiao-family', sentence: '這兩個答案哪一個比___正確？', options: ['教', '較', '校', '郊'], answer: '較', explanation: '跟比較有關，用「較」。' },
  { id: 'jiao-family-3', groupId: 'jiao-family', sentence: '星期天我們全家一起去___外踏青。', options: ['教', '較', '校', '郊'], answer: '郊', explanation: '跟郊外、地方有關，用「郊」。' },

  { id: 'bao-family-1', groupId: 'bao-family', sentence: '妹妹跌倒哭了，媽媽趕緊___住她安慰。', options: ['抱', '跑', '泡', '飽'], answer: '抱', explanation: '跟手的動作有關，用「抱」。' },
  { id: 'bao-family-2', groupId: 'bao-family', sentence: '運動會的時候，大家都很努力地___步。', options: ['抱', '跑', '泡', '飽'], answer: '跑', explanation: '跟腳的動作有關，用「跑」。' },
  { id: 'bao-family-3', groupId: 'bao-family', sentence: '吃完這頓飯，我覺得肚子好___。', options: ['抱', '跑', '泡', '飽'], answer: '飽', explanation: '跟吃東西有關，用「飽」。' },

  { id: 'sheng-family-1', groupId: 'sheng-family', sentence: '晚上抬頭看，天空中有好多___星在閃爍。', options: ['星', '姓', '性'], answer: '星', explanation: '跟天空、天體有關，用「星」。' },
  { id: 'sheng-family-2', groupId: 'sheng-family', sentence: '請問你貴___大名？', options: ['星', '姓', '性'], answer: '姓', explanation: '跟姓氏有關，用「姓」。' },
  { id: 'sheng-family-3', groupId: 'sheng-family', sentence: '他的個___很開朗，交了很多朋友。', options: ['星', '姓', '性'], answer: '性', explanation: '跟心理、個性有關，用「性」。' },

  { id: 'ta-ta-ta-1', groupId: 'ta-ta-ta', sentence: '小明的爸爸是老師，___每天都很早出門上班。', options: ['他', '她', '它'], answer: '他', explanation: '指男性，用「他」。' },
  { id: 'ta-ta-ta-2', groupId: 'ta-ta-ta', sentence: '這隻小狗很可愛，___喜歡跟我一起玩。', options: ['他', '她', '它'], answer: '它', explanation: '指動物，用「它」。' },

  { id: 'mang-wang-1', groupId: 'mang-wang', sentence: '媽媽每天都很___碌地照顧我們。', options: ['忙', '忘'], answer: '忙', explanation: '「忙碌」的部件是「忄＋亡」。' },
  { id: 'mang-wang-2', groupId: 'mang-wang', sentence: '我差點___記帶雨傘出門。', options: ['忙', '忘'], answer: '忘', explanation: '「忘記」的部件是「亡＋心」上下排列。' },

  { id: 'shao-family-1', groupId: 'shao-family', sentence: '老師要我們把生字___寫三遍。', options: ['抄', '沙', '吵'], answer: '抄', explanation: '跟手的動作有關，用「抄」。' },
  { id: 'shao-family-2', groupId: 'shao-family', sentence: '我們在海邊的___灘上堆城堡。', options: ['抄', '沙', '吵'], answer: '沙', explanation: '跟水、沙灘有關，用「沙」。' },
  { id: 'shao-family-3', groupId: 'shao-family', sentence: '弟弟和妹妹又在為了玩具而___架了。', options: ['抄', '沙', '吵'], answer: '吵', explanation: '跟嘴巴、聲音有關，用「吵」。' },

  { id: 'tong-family-1', groupId: 'tong-family', sentence: '山壁上有一個很深的山___。', options: ['洞', '同', '銅'], answer: '洞', explanation: '跟坑洞、水有關，用「洞」。' },
  { id: 'tong-family-2', groupId: 'tong-family', sentence: '我和妹妹穿了___一件款式的衣服。', options: ['洞', '同', '銅'], answer: '同', explanation: '表示一樣，用「同」。' },
  { id: 'tong-family-3', groupId: 'tong-family', sentence: '這個___板是爺爺小時候用過的舊錢幣。', options: ['洞', '同', '銅'], answer: '銅', explanation: '跟金屬有關，用「銅」。' },

  { id: 'he-family-1', groupId: 'he-family', sentence: '這條___水緩緩地流向大海。', options: ['河', '何', '荷'], answer: '河', explanation: '跟水有關，用「河」。' },
  { id: 'he-family-2', groupId: 'he-family', sentence: '這件事該如___處理才好呢？', options: ['河', '何', '荷'], answer: '何', explanation: '表示疑問，用「何」。' },
  { id: 'he-family-3', groupId: 'he-family', sentence: '池塘裡開滿了粉紅色的___花。', options: ['河', '何', '荷'], answer: '荷', explanation: '跟植物有關，用「荷」。' },

  { id: 'miao-family-1', groupId: 'miao-family', sentence: '農夫辛苦地照顧田裡的禾___。', options: ['苗', '描', '瞄'], answer: '苗', explanation: '跟植物有關，用「苗」。' },
  { id: 'miao-family-2', groupId: 'miao-family', sentence: '這篇作文把公園的景色___寫得很生動。', options: ['苗', '描', '瞄'], answer: '描', explanation: '跟用手畫、寫有關，用「描」。' },
  { id: 'miao-family-3', groupId: 'miao-family', sentence: '他仔細___準籃框，投出漂亮的一球。', options: ['苗', '描', '瞄'], answer: '瞄', explanation: '跟眼睛、瞄準有關，用「瞄」。' },

  { id: 'ge-family-1', groupId: 'ge-family', sentence: '園遊會裡有___式各樣的攤位。', options: ['各', '客', '格', '落'], answer: '各', explanation: '「各式各樣」表示種類多，用「各」。' },
  { id: 'ge-family-2', groupId: 'ge-family', sentence: '家裡今天來了幾位遠方的___人。', options: ['各', '客', '格', '落'], answer: '客', explanation: '跟人有關，用「客」。' },
  { id: 'ge-family-3', groupId: 'ge-family', sentence: '樹葉一片片地飄___下來。', options: ['各', '客', '格', '落'], answer: '落', explanation: '跟掉下有關，用「落」。' },

  { id: 'ling-family-1', groupId: 'ling-family', sentence: '老師下___後，同學們立刻安靜下來。', options: ['令', '今', '冷', '鈴'], answer: '令', explanation: '「命令」的意思，用「令」。' },
  { id: 'ling-family-2', groupId: 'ling-family', sentence: '___天的數學課教了新的單元。', options: ['令', '今', '冷', '鈴'], answer: '今', explanation: '表示現在這個時候，用「今」。' },
  { id: 'ling-family-3', groupId: 'ling-family', sentence: '上課___聲一響，同學們就跑進教室。', options: ['令', '今', '冷', '鈴'], answer: '鈴', explanation: '跟金屬、聲音有關，用「鈴」。' },

  { id: 'xiang-family-1', groupId: 'xiang-family', sentence: '我和妹妹每天都會互___幫忙。', options: ['相', '箱', '想', '霜'], answer: '相', explanation: '「互相」的意思，用「相」。' },
  { id: 'xiang-family-2', groupId: 'xiang-family', sentence: '這個木___裡裝滿了舊玩具。', options: ['相', '箱', '想', '霜'], answer: '箱', explanation: '跟容器有關，用「箱」。' },
  { id: 'xiang-family-3', groupId: 'xiang-family', sentence: '出國念書的哥哥很___念台灣的家人。', options: ['相', '箱', '想', '霜'], answer: '想', explanation: '跟心裡想念有關，用「想」。' },

  { id: 'zhu-family-1', groupId: 'zhu-family', sentence: '這隻小狗的___人每天都會帶牠散步。', options: ['主', '住', '注', '柱'], answer: '主', explanation: '「主人」的意思，用「主」。' },
  { id: 'zhu-family-2', groupId: 'zhu-family', sentence: '我家___在一棟公寓的三樓。', options: ['主', '住', '注', '柱'], answer: '住', explanation: '跟居住有關，用「住」。' },
  { id: 'zhu-family-3', groupId: 'zhu-family', sentence: '老師提醒我們寫作業時要___意標點符號。', options: ['主', '住', '注', '柱'], answer: '注', explanation: '「注意」跟專注有關，用「注」。' },
];
