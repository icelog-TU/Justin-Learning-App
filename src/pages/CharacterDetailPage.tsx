import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  HEART_COST_STARS,
  parseCharacterId,
  formatBigNumber,
  characterValueFromId,
  characterLabelFromId,
  characterMaxHearts,
  characterCollectionIndexFromId,
  characterInteractionTierCountForId,
  characterInteractionRequiredHeartsForId,
} from '../lib/rewards';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { numberToChineseWords } from '../lib/chineseNumber';
import {
  characterGreetingMessage,
  characterInteractionTemplateIndex,
  characterNumberInteractionMessageForId,
  characterSecretMessage,
} from '../lib/characterInteractions';
import { speak } from '../lib/speech';
import { playPageEnterSound, playHeartSound, playInteractionSound, playUnlockFanfare } from '../lib/sound';

interface InteractionTier {
  requiredHearts: number;
  icon: string;
  label: string;
  message: string;
}

/** Deterministic per-character pick — same character always gets the same variant after every reload. */
function seedFor(base: number, exponent: number, salt: number): number {
  return base * 977 + exponent * 331 + salt * 131;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

const FOODS = ['牛肉麵', '壽司', '披薩', '水餃', '咖哩飯', '炒飯', '漢堡', '義大利麵', '滷肉飯', '火鍋', '燒烤', '三明治', '炸雞', '拉麵', '便當', '蚵仔煎'];
const SONGS = ['小星星', '兩隻老虎', '生日快樂歌', '造飛機', '捕魚歌', '天黑黑', '虫虫飛', '望春風', '丟手帕', '小蜜蜂', '小蘋果', '妹妹背著洋娃娃'];
const DANCES = ['芭蕾舞', '街舞', '兔子舞', '機器人舞', '扭扭舞', '國標舞', '手指舞'];
const SHOWS = ['巧虎', '海綿寶寶', '佩佩豬', '恐龍卡通', '汪汪隊立大功', '神奇寶貝', '櫻桃小丸子', '哆啦A夢', '湯瑪士小火車', '小小兵'];
const STARS = ['天狼星', '織女星', '北極星', '牛郎星', '獵戶座', '火星', '土星', '北斗七星'];
const MOUNTAINS = [
  { name: '陽明山', height: 1120 },
  { name: '玉山', height: 3952 },
  { name: '合歡山', height: 3417 },
  { name: '阿里山', height: 2216 },
  { name: '七星山', height: 1120 },
  { name: '大霸尖山', height: 3492 },
];
const SPORTS = ['游泳', '羽毛球', '網球', '足球', '籃球', '桌球', '棒球', '排球', '慢跑', '騎腳踏車'];
const DRAW_SUBJECTS = ['小狗', '城堡', '彩虹', '太空船', '恐龍', '花朵', '大海', '山景'];
const BOOKS = ['西遊記', '三國演義', '安徒生童話', '格林童話', '小王子', '愛麗絲夢遊仙境', '昆蟲記', '十萬個為什麼'];
const KITES = ['老鷹風箏', '蝴蝶風箏', '彩虹風箏', '金魚風箏', '龍形風箏'];
const PICNIC_SPOTS = ['大安森林公園', '河濱公園', '中正紀念堂', '植物園', '青年公園'];
const CAMP_SPOTS = ['溪頭', '武陵農場', '阿里山', '日月潭', '墾丁'];
const BBQ_FOODS = ['香腸', '玉米', '雞翅', '棉花糖', '魷魚'];
const FISH = ['吳郭魚', '鯉魚', '鱸魚', '鯽魚', '鰻魚'];
const BEACHES = ['墾丁海灘', '福隆海灘', '白沙灣', '小琉球'];
const MOVIES = ['動物方城市', '冰雪奇緣', '海底總動員', '功夫熊貓', '怪獸電力公司', '腦筋急轉彎'];
const BAKED_GOODS = ['杯子蛋糕', '餅乾', '麵包', '鬆餅', '馬芬蛋糕'];
const FLOWERS = ['向日葵', '玫瑰', '鬱金香', '櫻花', '薰衣草'];
const GAMES = ['大富翁', '跳棋', '撲克牌', '大老二', 'UNO'];
const FOLD_SHAPES = ['紙鶴', '紙飛機', '愛心', '星星', '青蛙'];
const ROOMS = ['房間', '客廳', '書房', '陽台'];
const FRUITS = ['蘋果', '草莓', '葡萄', '橘子', '西瓜', '芒果'];
const CRAFTS = ['卡片', '黏土公仔', '紙風車', '串珠手環'];
const FIREWORK_COLORS = ['金色', '紅色', '綠色', '紫色', '彩虹色'];
const ANIMALS = ['獅子', '長頸鹿', '貓熊', '企鵝', '大象', '老虎'];

const TEMPLATES: {
  icon: string;
  label: string;
  message: (base: number, exponent: number, requiredHearts: number) => string;
}[] = [
  { icon: '👋', label: '打招呼', message: (base, exponent) => `你好！我是 ${base} 的 ${exponent} 次方！` },
  {
    // The builder supplies the family-specific number explanation for this reserved position.
    icon: '💬', label: '聊聊天', message: () => '',
  },
  { icon: '🍽️', label: '一起吃飯', message: (base, exponent) => `我們一起吃了${pick(FOODS, seedFor(base, exponent, 2))}，好好吃！` },
  { icon: '🎤', label: '一起唱歌', message: (base, exponent) => `我們一起唱了《${pick(SONGS, seedFor(base, exponent, 3))}》，唱得好開心！` },
  { icon: '💃', label: '一起跳舞', message: (base, exponent) => `我們一起跳了${pick(DANCES, seedFor(base, exponent, 4))}！` },
  { icon: '📺', label: '一起看電視', message: (base, exponent) => `我們一起看了《${pick(SHOWS, seedFor(base, exponent, 5))}》！` },
  { icon: '🧽', label: '一起洗碗', message: (base, exponent) => `我們一起洗了 ${(seedFor(base, exponent, 6) % 8) + 2} 個碗，廚房變得好乾淨！` },
  { icon: '🌟', label: '一起看星星', message: (base, exponent) => `我們一起看到了${pick(STARS, seedFor(base, exponent, 7))}，好漂亮！` },
  {
    icon: '⛰️', label: '一起爬山', message: (base, exponent) => {
      const m = pick(MOUNTAINS, seedFor(base, exponent, 8));
      return `我們一起爬了${m.name}，海拔 ${m.height} 公尺！`;
    },
  },
  { icon: '🏃', label: '一起運動', message: (base, exponent) => `我們一起做了${pick(SPORTS, seedFor(base, exponent, 9))}運動！` },
  { icon: '🤫', label: '說悄悄話', message: (base, exponent) => `偷偷告訴你，我最要好的朋友是 ${base} 的 ${Math.min(46, exponent + 1)} 次方！` },
  { icon: '🎨', label: '一起畫畫', message: (base, exponent) => `我們一起畫了一幅${pick(DRAW_SUBJECTS, seedFor(base, exponent, 11))}的畫！` },
  { icon: '📚', label: '一起看書', message: (base, exponent) => `我們一起看了《${pick(BOOKS, seedFor(base, exponent, 12))}》！` },
  { icon: '🪁', label: '一起放風箏', message: (base, exponent) => `我們一起放了${pick(KITES, seedFor(base, exponent, 13))}，飛得好高！` },
  { icon: '🧺', label: '一起野餐', message: (base, exponent) => `我們一起去${pick(PICNIC_SPOTS, seedFor(base, exponent, 14))}野餐！` },
  { icon: '🏕️', label: '一起露營', message: (base, exponent) => `我們一起去${pick(CAMP_SPOTS, seedFor(base, exponent, 15))}露營！` },
  { icon: '🍖', label: '一起烤肉', message: (base, exponent) => `我們一起烤了${pick(BBQ_FOODS, seedFor(base, exponent, 16))}，好香喔！` },
  { icon: '🎣', label: '一起釣魚', message: (base, exponent) => `我們一起釣到了一條${pick(FISH, seedFor(base, exponent, 17))}！` },
  { icon: '🚲', label: '一起騎腳踏車', message: (base, exponent) => `我們一起騎了 ${(seedFor(base, exponent, 18) % 20) + 1} 公里的腳踏車！` },
  { icon: '🏖️', label: '一起堆沙堡', message: (base, exponent) => `我們一起在${pick(BEACHES, seedFor(base, exponent, 19))}堆了沙堡！` },
  { icon: '🎬', label: '一起看電影', message: (base, exponent) => `我們一起看了《${pick(MOVIES, seedFor(base, exponent, 20))}》！` },
  { icon: '🧁', label: '一起烘焙', message: (base, exponent) => `我們一起烤了${pick(BAKED_GOODS, seedFor(base, exponent, 21))}！` },
  { icon: '🌱', label: '一起種花', message: (base, exponent) => `我們一起種了${pick(FLOWERS, seedFor(base, exponent, 22))}！` },
  { icon: '🎲', label: '一起玩桌遊', message: (base, exponent) => `我們一起玩了${pick(GAMES, seedFor(base, exponent, 23))}！` },
  { icon: '🧩', label: '一起拼圖', message: (base, exponent) => `我們一起完成了一幅 ${((seedFor(base, exponent, 24) % 9) + 1) * 100} 片的拼圖！` },
  { icon: '📄', label: '一起摺紙', message: (base, exponent) => `我們一起摺了${pick(FOLD_SHAPES, seedFor(base, exponent, 25))}！` },
  { icon: '🧹', label: '一起打掃', message: (base, exponent) => `我們一起把${pick(ROOMS, seedFor(base, exponent, 26))}打掃得好乾淨！` },
  { icon: '🍎', label: '一起摘水果', message: (base, exponent) => `我們一起摘了${pick(FRUITS, seedFor(base, exponent, 27))}！` },
  { icon: '✂️', label: '一起做勞作', message: (base, exponent) => `我們一起做了${pick(CRAFTS, seedFor(base, exponent, 28))}！` },
  { icon: '🌠', label: '一起看流星雨', message: (base, exponent) => `我們一起看到了 ${(seedFor(base, exponent, 29) % 12) + 1} 顆流星，快許願！` },
  { icon: '🎆', label: '一起放煙火', message: (base, exponent) => `我們一起放了${pick(FIREWORK_COLORS, seedFor(base, exponent, 30))}的煙火！` },
  { icon: '🦁', label: '一起去動物園', message: (base, exponent) => `我們一起去動物園看了${pick(ANIMALS, seedFor(base, exponent, 31))}！` },
  { icon: '💖', label: '特別時刻', message: (_base, _exponent, requiredHearts) => `謝謝你給我 ${requiredHearts} 顆愛心！我們的感情越來越好了 ❤️` },
];

/**
 * Every character starts with greeting and number chat. After those two fixed relationship-building steps,
 * each character receives a different deterministic walk through the remaining 31 templates. Seven is coprime
 * with 31, so a character never repeats an activity before all remaining templates have been visited.
 * Persistent interaction identity is the character id plus tier index; internal identifiers must never be
 * exposed in child-facing display or speech.
 */
function buildInteractionTiers(id: string, base: number, exponent: number): InteractionTier[] {
  const tierCount = characterInteractionTierCountForId(id);
  const characterIndex = characterCollectionIndexFromId(id);
  const tiers: InteractionTier[] = [];
  for (let i = 1; i <= tierCount; i++) {
    const requiredHearts = characterInteractionRequiredHeartsForId(id, i - 1);
    // Justin wants every character to greet him first, then explain how its number is formed.
    // Only the remaining activities are shuffled.
    const templateIndex = characterInteractionTemplateIndex(characterIndex, i - 1, TEMPLATES.length);
    const template = TEMPLATES[templateIndex];
    const message = templateIndex === 0
      ? characterGreetingMessage(id)
      : templateIndex === 1
        ? characterNumberInteractionMessageForId(id, requiredHearts)
        : templateIndex === 10
          ? characterSecretMessage(id)
          : template.message(base, exponent, requiredHearts);
    tiers.push({
      requiredHearts,
      icon: template.icon,
      label: template.label,
      message,
    });
  }
  return tiers;
}

const MOOD_STAGES: { min: number; emoji: string }[] = [
  { min: 0, emoji: '😐' }, { min: 0.2, emoji: '🙂' }, { min: 0.4, emoji: '😊' },
  { min: 0.6, emoji: '😄' }, { min: 0.8, emoji: '🥰' }, { min: 1, emoji: '🤩' },
];

function characterMood(hearts: number, maxHearts: number): string {
  const ratio = maxHearts > 0 ? hearts / maxHearts : 0;
  let mood = MOOD_STAGES[0].emoji;
  for (const stage of MOOD_STAGES) if (ratio >= stage.min) mood = stage.emoji;
  return mood;
}

interface HeartParticle { id: number; tx: number; ty: number; rot: number; delay: number }

function buildHeartParticles(idSeed: number): HeartParticle[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: idSeed + i,
    tx: (Math.random() - 0.5) * 170,
    ty: -(70 + Math.random() * 110),
    rot: (Math.random() - 0.5) * 200,
    delay: Math.random() * 0.12,
  }));
}

export default function CharacterDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? decodeURIComponent(rawId) : '';
  const { data, giveHeart, markCharacterInteractionSeen } = useAppDataContext();
  const [message, setMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [shaking, setShaking] = useState(false);
  const particleIdRef = useRef(0);

  useEffect(() => { playPageEnterSound(); }, []);

  const hearts = data.characters[id];
  if (hearts === undefined) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">還沒有收集到這個角色喔，去轉蛋試試看吧！</p>
        <Link to="/characters" className="text-teal-600 text-sm font-medium underline">← 回角色收藏</Link>
      </div>
    );
  }

  const parsed = parseCharacterId(id);
  const base = parsed.kind === 'power' ? parsed.base : characterCollectionIndexFromId(id) + 1;
  const exponent = parsed.kind === 'power' ? parsed.exponent : parsed.index;
  const maxHearts = characterMaxHearts(id);
  const isFull = hearts >= maxHearts;
  const canGiveHeart = !isFull && data.stars >= HEART_COST_STARS;
  const tiers = buildInteractionTiers(id, base, exponent);
  const seenTiers = new Set(data.seenCharacterInteractions[id] ?? []);
  const value = characterValueFromId(id);
  const label = characterLabelFromId(id);
  function handleGiveHeart() {
    const before = hearts;
    if (!giveHeart(id)) return;
    playHeartSound();
    particleIdRef.current += 7;
    setHeartParticles(buildHeartParticles(particleIdRef.current));
    setShaking(true);
    window.setTimeout(() => setHeartParticles([]), 950);
    window.setTimeout(() => setShaking(false), 650);
    const after = before + 1;
    const newlyUnlockedIndex = tiers.findIndex((tier) => tier.requiredHearts > before && tier.requiredHearts <= after);
    if (newlyUnlockedIndex !== -1) {
      playUnlockFanfare();
      setJustUnlocked(newlyUnlockedIndex);
      window.setTimeout(() => setJustUnlocked(null), 700);
    }
    window.setTimeout(() => speak(after % 2 === 1 ? '謝謝你的愛心！' : '恭喜！解鎖新互動！'), 550);
  }

  function handleGreeting() {
    const text = characterGreetingMessage(id);
    setMessage(text);
    speak(text);
  }

  function handleSpeakValue() { speak(numberToChineseWords(value)); }

  function handleInteract(tier: InteractionTier, index: number) {
    setMessage(tier.message);
    playInteractionSound();
    speak(tier.message);
    markCharacterInteractionSeen(id, index);
  }

  return (
    <div className="space-y-4">
      <Link to="/characters" className="text-teal-600 text-sm font-medium underline">← 回角色收藏</Link>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
        <button type="button" onClick={handleGreeting} className="mx-auto block" aria-label="跟角色打招呼">
          <div className="relative mx-auto w-28 h-28">
            {heartParticles.map((p) => (
              <span key={p.id} className="absolute text-2xl left-1/2 top-1/2" style={{
                '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--rot': `${p.rot}deg`,
                animation: `heart-burst-particle 0.9s ease-out ${p.delay}s forwards`,
              } as React.CSSProperties}>💗</span>
            ))}
            <CharacterAvatar
              id={id}
              size="large"
              style={{ animation: shaking ? 'heart-happy 0.65s ease-in-out' : undefined }}
            />
            <span className="absolute -bottom-1 -right-1 text-3xl bg-white rounded-full shadow"
              style={shaking ? { animation: 'unlock-pop 0.6s ease-out' } : undefined}>
              {characterMood(hearts, maxHearts)}
            </span>
          </div>
          <p className="text-3xl font-extrabold text-orange-600 mt-3">{label}</p>
        </button>
        <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5">
          = {formatBigNumber(value)}
          <button type="button" onClick={handleSpeakValue} className="text-sky-500 hover:text-sky-600" aria-label="唸出這個數字" title="唸出這個數字">🔊</button>
        </p>

        <div className="pt-2">
          <p className="text-sm text-gray-600 mb-2">
            好感度：{hearts > 0 ? `${hearts} 顆` : '尚未培養'}（{hearts} / {maxHearts} 顆愛心{isFull && ' 💯'}）
          </p>
          <div className="flex flex-wrap justify-center gap-1 max-w-sm mx-auto">
            {Array.from({ length: maxHearts }, (_, i) => (
              <span key={i} className="text-xl leading-none" style={i === hearts - 1 && shaking ? { animation: 'unlock-pop 0.6s ease-out' } : undefined}>
                {i < hearts ? '❤️' : '🤍'}
              </span>
            ))}
          </div>
        </div>

        <button type="button" disabled={!canGiveHeart} onClick={handleGiveHeart}
          className="mt-2 text-sm font-medium rounded-full px-6 py-2 bg-pink-500 disabled:bg-gray-200 disabled:text-gray-400 text-white">
          {isFull ? '已滿 ❤️' : `給愛心 (${HEART_COST_STARS}⭐)`}
        </button>
      </div>

      {message && (
        <div className="bg-pink-50 rounded-2xl shadow p-4 text-sm text-gray-700">
          <span className="font-semibold text-pink-600">{label}：</span>{message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">互動（共 {tiers.length} 種）</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiers.map((tier, i) => {
            const unlocked = hearts >= tier.requiredHearts;
            const unseen = unlocked && !seenTiers.has(i);
            const animations = [
              justUnlocked === i ? 'unlock-pop 0.7s ease-out' : null,
              unseen ? 'twinkle-glow 1.5s ease-in-out infinite' : null,
            ].filter(Boolean).join(', ');
            return (
              <button key={i} type="button" disabled={!unlocked} onClick={() => handleInteract(tier, i)}
                style={animations ? { animation: animations } : undefined}
                className={`rounded-xl border p-3 text-center space-y-1 relative ${unlocked ? 'bg-white border-orange-100 hover:border-orange-300' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                {unseen && <span className="absolute -top-1.5 -right-1.5 text-sm">✨</span>}
                <p className="text-2xl">{unlocked ? tier.icon : '🔒'}</p>
                <p className="text-xs font-medium">{tier.label}</p>
                <p className={`text-[10px] ${unlocked ? 'text-pink-500' : 'text-gray-400'}`}>需要 {tier.requiredHearts} 顆愛心</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
