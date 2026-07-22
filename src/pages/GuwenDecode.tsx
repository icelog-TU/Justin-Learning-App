import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { findGuwenText, type GuwenText, type GuwenWord } from '../data/guwen';
import { tokenizeGuwenText } from '../lib/guwenGame';
import { speak, speakSequence, pauseSpeech, resumeSpeech, cancelSpeech } from '../lib/speech';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
} from '../lib/rewards';

type Phase = 'intro' | 'listening' | 'decoding' | 'complete';

const INTRO_LINE = '小學者，我們要一起破譯這些古文字！';
const LISTEN_LEAD_IN = '首先，跟我們一起聽一遍全文。';
const LISTEN_PROMPT =
  '你是不是完全聽不懂它在說什麼呢？沒關係，跟著我們一步一步破解，每一個字都破解完之後，你就會自然看懂這整篇文章了！';

function introParagraph(text: GuwenText): string {
  return `這篇文章裡，很多字看起來像你平常認識的漢字，對不對？但其實裡面藏了 ${text.words.length} 個「古文字」——它們的意思，跟現在完全不一樣！`;
}

/** Splits `sentence` on every occurrence of `char`, highlighting each match — used for both the target
 * sentence and the corpus example sentences, so the character under study always stands out the same way. */
function highlightChar(sentence: string, char: string): ReactNode[] {
  const parts = sentence.split(char);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      nodes.push(
        <span key={`h-${i}`} className="text-indigo-600 font-bold">
          {char}
        </span>,
      );
    }
    nodes.push(<span key={`t-${i}`}>{part}</span>);
  });
  return nodes;
}

export default function GuwenDecode() {
  const { textId } = useParams<{ textId: string }>();
  const text = textId ? findGuwenText(textId) : undefined;
  const { data, reward, recordGuwenWord, completeGuwenText } = useAppDataContext();

  const progress = text ? data.guwenProgress[text.id] : undefined;
  const decodedIds = useMemo(() => new Set(progress?.decodedWordIds ?? []), [progress]);
  const alreadyComplete = Boolean(progress?.completedAt);

  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadyComplete) return 'complete';
    if (decodedIds.size > 0) return 'decoding';
    return 'intro';
  });
  const [wordIndex, setWordIndex] = useState(() => {
    if (!text) return 0;
    const firstUnsolved = text.words.findIndex((w) => !decodedIds.has(w.id));
    return firstUnsolved === -1 ? 0 : firstUnsolved;
  });
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  function playFullSequence(fullText: string) {
    setIsPlaying(true);
    setIsPaused(false);
    speakSequence([LISTEN_LEAD_IN, fullText, LISTEN_PROMPT], () => setIsPlaying(false));
  }

  function toggleFullPlayback() {
    if (!text) return;
    if (!isPlaying) {
      playFullSequence(text.fullText);
    } else if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
    } else {
      pauseSpeech();
      setIsPaused(true);
    }
  }

  function playOneSentence(sentence: string) {
    setIsPlaying(false);
    setIsPaused(false);
    speak(sentence);
  }

  useEffect(() => {
    if (phase !== 'intro' || !text) return;
    speakSequence([text.introSpokenLine, `標題是《${text.title}》。`, introParagraph(text)]);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text]);

  useEffect(() => {
    if (phase !== 'listening' || !text) return;
    playFullSequence(text.fullText);
    return () => {
      cancelSpeech();
      setIsPlaying(false);
      setIsPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text]);

  useEffect(() => {
    if (phase !== 'complete' || !text) return;
    const timer = window.setTimeout(() => speak(text.fullText), 400);
    return () => window.clearTimeout(timer);
  }, [phase, text]);

  if (!text) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">找不到這篇古文。</p>
        <Link to="/guwen" className="text-teal-600 font-medium">
          ← 回古文破譯家
        </Link>
      </div>
    );
  }

  const tokens = tokenizeGuwenText(text.fullText, text.words);
  const currentWord: GuwenWord | undefined = text.words[wordIndex];

  function renderPassage(currentWordId: string | null) {
    return (
      <p className="text-xl sm:text-2xl leading-loose tracking-wide text-center">
        {tokens.map((token, i) => {
          if (!token.wordId) return <span key={i}>{token.text}</span>;
          const solved = decodedIds.has(token.wordId);
          if (solved) {
            return (
              <span key={i} className="text-amber-600 font-bold">
                {token.text}
              </span>
            );
          }
          const isCurrent = token.wordId === currentWordId;
          return (
            <span
              key={i}
              className={isCurrent ? 'text-indigo-600 font-bold' : 'text-violet-400 font-bold'}
              style={{ animation: `guwen-glow ${isCurrent ? 1.4 : 2.4}s ease-in-out infinite` }}
            >
              {token.text}
            </span>
          );
        })}
      </p>
    );
  }

  function handleSelect(index: number) {
    if (!currentWord || feedback === 'correct') return;
    if (index === currentWord.correctIndex) {
      setFeedback('correct');
      setWrongIndex(null);
      recordGuwenWord(text!.id, currentWord.id);
      reward(COIN_PER_GUWEN_WORD, STAR_PER_GUWEN_WORD);
      window.setTimeout(() => speak(`「${currentWord.char}」的意思是${currentWord.meaning}`), 250);
    } else {
      setWrongIndex(index);
      window.setTimeout(() => setWrongIndex((prev) => (prev === index ? null : prev)), 700);
    }
  }

  function handleNextWord() {
    setFeedback(null);
    setWrongIndex(null);
    if (wordIndex + 1 >= text!.words.length) {
      completeGuwenText(text!.id);
      reward(GUWEN_TEXT_COMPLETE_BONUS_COINS, GUWEN_TEXT_COMPLETE_BONUS_STARS, { big: true });
      setPhase('complete');
    } else {
      setWordIndex((i) => i + 1);
    }
  }

  return (
    <div className="space-y-4">
      {phase !== 'intro' && (
        <div className="flex items-center justify-between">
          <Link to="/guwen" className="text-sm text-gray-400 hover:text-gray-600">
            ← 回古文破譯家
          </Link>
          {phase === 'decoding' && (
            <span className="text-sm font-semibold text-amber-600">
              已破解 {decodedIds.size} / {text.words.length}
            </span>
          )}
        </div>
      )}

      {phase === 'intro' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <Link to="/guwen" className="block text-left text-sm text-gray-400 hover:text-gray-600">
            ← 回古文破譯家
          </Link>
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-xs text-amber-600 font-semibold">{text.source}</p>
            <button
              type="button"
              onClick={() => speak(text.introSpokenLine)}
              aria-label="聽這段介紹"
              className="text-amber-500"
            >
              🔊
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{text.title}</h2>
            <button
              type="button"
              onClick={() => speak(`標題是《${text.title}》。`)}
              aria-label="聽標題"
              className="text-amber-500 text-lg"
            >
              🔊
            </button>
          </div>
          <div className="flex items-start justify-center gap-2">
            <p className="text-sm text-gray-500">{introParagraph(text)}</p>
            <button
              type="button"
              onClick={() => speak(introParagraph(text))}
              aria-label="聽這段說明"
              className="text-amber-500 shrink-0 mt-0.5"
            >
              🔊
            </button>
          </div>
          <div className="py-2">{renderPassage(null)}</div>
          <p className="text-xs text-gray-400">上面發光的字，就是等一下要破解的古文字</p>
          <button
            type="button"
            onClick={() => {
              speak(INTRO_LINE);
              setPhase('listening');
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 py-3"
          >
            🏺 開始破譯
          </button>
        </div>
      )}

      {phase === 'listening' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <h2 className="text-lg font-bold text-gray-800">先聽聽看這篇文章……</h2>
          <div className="py-2">{renderPassage(null)}</div>
          <button
            type="button"
            onClick={toggleFullPlayback}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 mx-auto"
          >
            {isPlaying ? (isPaused ? '▶️ 繼續播放全文' : '⏸ 暫停播放') : '🔊 播放全文'}
          </button>

          <div className="text-left space-y-2">
            <p className="text-xs text-gray-400 text-center">或者一句一句聽</p>
            {text.sentences.map((sentence, i) => (
              <button
                key={i}
                type="button"
                onClick={() => playOneSentence(sentence)}
                className="w-full flex items-center gap-2 bg-gray-50 hover:bg-sky-50 rounded-xl px-4 py-2.5"
              >
                <span className="text-sky-500 shrink-0">🔊</span>
                <span className="text-gray-700 text-sm sm:text-base">{sentence}</span>
              </button>
            ))}
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">{LISTEN_PROMPT}</div>
          <button
            type="button"
            onClick={() => setPhase('decoding')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6 py-3"
          >
            開始破解第一個字 →
          </button>
        </div>
      )}

      {phase === 'decoding' && currentWord && (
        <>
          <div className="bg-white rounded-2xl shadow p-5">{renderPassage(currentWord.id)}</div>

          <div className="flex flex-wrap justify-center gap-2">
            {text.words.map((w, i) => {
              const solved = decodedIds.has(w.id);
              const isCurrent = i === wordIndex;
              return (
                <span
                  key={w.id}
                  className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                    solved
                      ? 'bg-amber-100 border-amber-400 text-amber-700'
                      : isCurrent
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-300'
                  }`}
                >
                  {solved || isCurrent ? w.char[0] : '🔒'}
                </span>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400">待破解的目標句</p>
              <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                {highlightChar(currentWord.targetSentence, currentWord.char)}
              </p>
              <button
                type="button"
                onClick={() => speak(currentWord.targetSentence)}
                className="text-xs text-sky-600"
              >
                🔊 聽這句話
              </button>
            </div>

            <p className="text-sm text-center text-gray-600">
              「<span className="font-bold text-indigo-600">{currentWord.char}</span>
              」在這句話裡是什麼意思？比比看，下面哪一句「語料」的用法跟它最接近？
            </p>

            <div className="space-y-2">
              {currentWord.corpus.map((c, i) => {
                const isWrong = wrongIndex === i;
                const isCorrectPick = feedback === 'correct' && i === currentWord.correctIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    disabled={feedback === 'correct'}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                      isCorrectPick
                        ? 'bg-emerald-50 border-emerald-400'
                        : isWrong
                          ? 'bg-red-50 border-red-300'
                          : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="text-gray-800">{highlightChar(c.sentence, currentWord.char)}</p>
                  </button>
                );
              })}
            </div>

            {feedback === 'correct' && (
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                <p className="font-bold text-emerald-700">
                  ✅ 破解成功！「{currentWord.char}」＝ {currentWord.meaning}
                </p>
                <p className="text-sm text-emerald-700">{currentWord.explanation}</p>
                <button
                  type="button"
                  onClick={handleNextWord}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
                >
                  {wordIndex + 1 >= text.words.length ? '🎉 完成！看看整篇文章' : '下一個古文字 →'}
                </button>
              </div>
            )}
            {wrongIndex !== null && feedback !== 'correct' && (
              <p className="text-center text-sm text-red-500">再想想看，比一比上下文的意思～</p>
            )}
          </div>
        </>
      )}

      {phase === 'complete' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <p className="text-3xl">🏆</p>
          <h2 className="text-xl font-bold text-gray-800">恭喜！你破解了整篇《{text.title}》！</h2>
          <div className="py-2">{renderPassage(null)}</div>
          <button
            type="button"
            onClick={() => speak(text.fullText)}
            className="text-sm text-sky-600 flex items-center justify-center gap-1 mx-auto"
          >
            🔊 再聽一次全文
          </button>

          <div className="bg-amber-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-amber-600">白話文（破解成功的獎勵）</p>
            <p className="text-sm text-gray-700 leading-relaxed">{text.modernTranslation}</p>
            <button type="button" onClick={() => speak(text.modernTranslation)} className="text-xs text-sky-600">
              🔊 聽白話文
            </button>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-indigo-600">💭 再想一想</p>
            <p className="text-sm text-gray-700">{text.reflectionQuestion}</p>
            {revealAnswer ? (
              <p className="text-sm text-indigo-700">{text.reflectionAnswer}</p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealAnswer(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                我想到答案了，看看對不對 →
              </button>
            )}
          </div>

          <Link
            to="/guwen"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6 py-3"
          >
            回古文破譯家
          </Link>
        </div>
      )}
    </div>
  );
}
