export const GUWEN_PRAISE_LINES = [
  '太棒了！你又破解了一個古文密碼！',
  '答對了！你的線索比對非常仔細！',
  '厲害！你找到藏在古文裡的關鍵了！',
  '破解成功！你的推理方向完全正確！',
  '做得好！你把眼前的線索連起來了！',
  '真敏銳！你注意到了重要的差別！',
  '太精彩了！這次的判斷很有根據！',
  '沒錯！你靠證據找到了答案！',
  '好厲害！古文的秘密又被你解開一個！',
  '完全正確！你的破譯能力又升級了！',
  '漂亮！你沒有被古老的用法難倒！',
  '答得真好！你抓住了這一題的重點！',
  '破解完成！你的觀察又快又準！',
  '真棒！你把古文線索看懂了！',
  '成功了！你又往讀懂古文前進一步！',
  '很好！你一步一步推到了正確答案！',
  '太強了！你從線索中找到了證據！',
  '答對了！你的古文雷達很靈敏！',
  '了不起！這個古文關卡被你突破了！',
  '好眼力！最重要的線索被你發現了！',
  '推理成功！你的答案有證據支持！',
  '真不簡單！你又讀懂了一點古文！',
  '太好了！你不是猜的，是推理出來的！',
  '沒問題！這一題你破解得很穩！',
  '讚！你把古文和證據成功接起來了！',
  '答案正確！你的破譯思路很清楚！',
  '又成功了！你離讀懂全文更近一步！',
  '真有耐心！仔細比對果然找到答案了！',
  '太厲害了！這個線索也難不倒你！',
  '完美破解！準備迎接下一個古文密碼吧！',
] as const;

export interface GuwenPraiseDraw {
  line: string;
  remaining: string[];
}

function shuffledPraiseBag(random: () => number): string[] {
  const bag = [...GUWEN_PRAISE_LINES];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
}

/**
 * Draws from a shuffled bag so every line is heard once before any line repeats.
 * The next bag also avoids opening with the line that ended the previous bag.
 */
export function drawGuwenPraise(
  remaining: readonly string[],
  previous: string | null,
  random: () => number = Math.random,
): GuwenPraiseDraw {
  const bag = [...remaining];
  if (bag.length === 0) {
    bag.push(...shuffledPraiseBag(random));
    const nextIndex = bag.length - 1;
    if (previous !== null && bag[nextIndex] === previous) {
      const replacementIndex = bag.findIndex((line) => line !== previous);
      [bag[nextIndex], bag[replacementIndex]] = [bag[replacementIndex], bag[nextIndex]];
    }
  }

  const line = bag.pop();
  if (line === undefined) {
    throw new Error('古文稱讚語句庫不可為空');
  }
  return { line, remaining: bag };
}
