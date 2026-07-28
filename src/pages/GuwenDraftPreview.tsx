import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DRAFT_SOURCES,
  draftQuestionIndexByNumber,
  findAdjacentRepetitions,
  githubEditUrl,
  githubRawUrl,
  parseDraftQuestions,
  resolveDraftSource,
  type DraftField,
  type DraftQuestion,
} from '../lib/guwenDraftPreview';
import { cancelSpeech, pauseSpeech, resumeSpeech, speakSequence } from '../lib/speech';
import {
  GuwenCausalNodes,
  GuwenChoiceList,
  GuwenClueList,
  GuwenCoreFeedbackBlock,
  GuwenExplanationBlock,
  GuwenKeyList,
  GuwenMultiSelectList,
  GuwenSequenceCardRow,
} from '../components/guwen/GuwenQuestionBlocks';

type PreviewState = 'answering' | 'wrong' | 'correct';

function Highlighted({ text }: { text: string }) {
  const parts = text.split(/(【[^】]+】)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^【.*】$/.test(part)
          ? <strong key={`${part}-${index}`} className="text-indigo-600">{part}</strong>
          : part,
      )}
    </>
  );
}

type Playback = {
  id: string;
  label: string;
  paused: boolean;
};

type AudioLineProps = {
  field: DraftField;
  id: string;
  label: string;
  activePlayback?: Playback;
  className?: string;
  onToggle: (id: string, label: string, texts: string[]) => void;
};

function AudioLine({ field, id, label, activePlayback, className = '', onToggle }: AudioLineProps) {
  const isActive = activePlayback?.id === id;
  return (
    <div className={className}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onToggle(id, label, [field.text, ...(field.pronunciationCues ?? [])])}
          aria-label={isActive ? `${activePlayback.paused ? '繼續' : '暫停'}${label}` : `播放${label}`}
          className="shrink-0 text-sky-500"
        >
          {isActive ? (activePlayback.paused ? '▶️' : '⏸') : '🔊'}
        </button>
        <p className="whitespace-pre-line"><Highlighted text={field.text} /></p>
      </div>
      {field.pronunciationCues?.map((cue, index) => {
        const cueId = `${id}-cue-${index}`;
        const cueIsActive = activePlayback?.id === cueId;
        return (
        <div key={`${cue}-${index}`} className="mt-1.5 flex items-start gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-left text-xs font-medium text-amber-800">
          <button
            type="button"
            onClick={() => onToggle(cueId, `${label}讀音提示`, [cue])}
            aria-label={cueIsActive ? `${activePlayback.paused ? '繼續' : '暫停'}${label}讀音提示` : `播放${label}讀音提示`}
            className="shrink-0 text-sky-500"
          >
            {cueIsActive ? (activePlayback.paused ? '▶️' : '⏸') : '🔊'}
          </button>
          <p>{cue}</p>
        </div>
        );
      })}
    </div>
  );
}

function readingOrder(question: DraftQuestion) {
  const lines: Array<{ label: string; text: string }> = [];
  if (question.target) lines.push({ label: '目標句', text: question.target.text });
  question.target?.pronunciationCues?.forEach((text) => lines.push({ label: '目標句讀音提示', text }));
  if (question.intro) {
    lines.push({ label: '引導語', text: question.intro.text });
    question.intro.pronunciationCues?.forEach((text) => lines.push({ label: '引導語讀音提示', text }));
  }
  question.preAnswerKeys.forEach((key, index) => {
    lines.push({ label: `密碼鑰匙 ${index + 1}`, text: key.code.text });
    lines.push({ label: `密碼鑰匙 ${index + 1} 已取得的線索`, text: key.decodedEvidence.text });
  });
  question.clues.forEach((clue, index) => {
    lines.push({ label: `線索 ${index + 1}`, text: clue.text });
    clue.pronunciationCues?.forEach((text) => lines.push({ label: `線索 ${index + 1} 讀音提示`, text }));
    if (clue.meaning) {
      lines.push({ label: `線索 ${index + 1} 已破解為`, text: clue.meaning.text });
      clue.meaning.pronunciationCues?.forEach((text) => lines.push({ label: `線索 ${index + 1} 白話讀音提示`, text }));
    }
  });
  if (question.question) lines.push({ label: '提問', text: question.question.text });
  question.options.forEach((option, index) => lines.push({ label: `選項 ${index + 1}`, text: option.text }));
  question.sequenceCards.forEach((card, index) => lines.push({ label: `事件卡 ${index + 1}`, text: card.text }));
  question.multiSelectOptions.forEach((option, index) => lines.push({ label: `勾選項目 ${index + 1}`, text: option.text }));
  question.causalNodes.forEach((node, index) => lines.push({ label: `因果階段 ${index + 1}`, text: node.text }));
  return lines;
}

export default function GuwenDraftPreview() {
  const [, setSearchParams] = useSearchParams();
  const initialParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const initialLessonPath = initialParams.get('lessonPath');
  const initialLegacyLessonId = initialParams.get('lesson');
  const initialLegacyQuestionIndex = Number(initialParams.get('question'));
  const initialPreviewState = initialParams.get('state');
  const initialSource = resolveDraftSource(initialLessonPath, initialLegacyLessonId);
  const [sourceIndex, setSourceIndex] = useState<number | undefined>(initialSource.index);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(
    Number.isInteger(initialLegacyQuestionIndex) && initialLegacyQuestionIndex >= 0
      ? initialLegacyQuestionIndex
      : 0,
  );
  const [previewState, setPreviewState] = useState<PreviewState>(
    initialPreviewState === 'wrong' || initialPreviewState === 'correct' ? initialPreviewState : 'answering',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(initialSource.error ?? '');
  const [loadedAt, setLoadedAt] = useState<Date>();
  const [playback, setPlayback] = useState<Playback>();
  const loadToken = useRef(0);
  const playbackToken = useRef(0);
  const source = sourceIndex === undefined ? undefined : DRAFT_SOURCES[sourceIndex];
  const question = questions[questionIndex];

  async function loadLatest() {
    if (!source) {
      setLoading(false);
      return;
    }
    const token = ++loadToken.current;
    const routeParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const routeLessonPath = routeParams.get('lessonPath');
    const routeLegacyLessonId = routeParams.get('lesson');
    const routeQuestionNumber = Number(routeParams.get('questionNumber'));
    const routeTargetsSource = routeLessonPath !== null
      ? routeLessonPath === source.path
      : routeLegacyLessonId === source.lessonId;
    const requested = routeTargetsSource
      && Number.isInteger(routeQuestionNumber)
      && routeQuestionNumber >= 1
      ? routeQuestionNumber
      : undefined;
    setLoading(true);
    setError('');
    stopPlayback();
    try {
      const response = await fetch(githubRawUrl(source), { cache: 'no-store' });
      if (!response.ok) throw new Error(`GitHub 回傳 ${response.status}`);
      const parsed = parseDraftQuestions(await response.text());
      if (!parsed.length) throw new Error('MD 裡找不到題目標題');
      if (loadToken.current !== token) return;
      const nextQuestionIndex = requested !== undefined
        ? draftQuestionIndexByNumber(parsed, requested)
        : Math.min(questionIndex, parsed.length - 1);
      setQuestionIndex(nextQuestionIndex);
      setQuestions(parsed);
      setLoadedAt(new Date());
    } catch (reason) {
      if (loadToken.current !== token) return;
      setQuestions([]);
      setError(reason instanceof Error ? reason.message : '無法載入 GitHub MD');
    } finally {
      if (loadToken.current === token) setLoading(false);
    }
  }

  useEffect(() => {
    if (!source) {
      setLoading(false);
      return;
    }
    void loadLatest();
    // source uniquely identifies the selected MD.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIndex]);

  useEffect(() => {
    if (!question || !source) return;
    const next = new URLSearchParams();
    next.set('lessonPath', source.path);
    next.set('questionNumber', String(question.number));
    next.set('state', previewState);
    setSearchParams(next, { replace: true });
  }, [previewState, question, setSearchParams, source]);

  useEffect(() => () => {
    playbackToken.current += 1;
    cancelSpeech();
  }, []);

  const order = useMemo(() => question ? readingOrder(question) : [], [question]);
  const repetitions = useMemo(() => findAdjacentRepetitions(order), [order]);
  const approvedCount = questions.filter((item) => /已核准|核准/.test(item.status)).length;

  function chooseQuestion(next: number) {
    stopPlayback();
    setQuestionIndex(next);
    setPreviewState('answering');
  }

  function chooseSource(next: number) {
    stopPlayback();
    setError('');
    setSourceIndex(next);
    setQuestionIndex(0);
    setPreviewState('answering');
  }

  function choosePreviewState(next: PreviewState) {
    stopPlayback();
    setPreviewState(next);
  }

  function stopPlayback() {
    playbackToken.current += 1;
    cancelSpeech();
    setPlayback(undefined);
  }

  function togglePause() {
    setPlayback((current) => {
      if (!current) return current;
      if (current.paused) {
        resumeSpeech();
        return { ...current, paused: false };
      }
      pauseSpeech();
      return { ...current, paused: true };
    });
  }

  function togglePlayback(id: string, label: string, texts: string[]) {
    if (playback?.id === id) {
      togglePause();
      return;
    }
    playbackToken.current += 1;
    const token = playbackToken.current;
    cancelSpeech();
    setPlayback({ id, label, paused: false });
    speakSequence(texts, () => {
      if (playbackToken.current === token) setPlayback(undefined);
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-3">
          <div className="mr-auto">
            <p className="text-xs font-bold tracking-widest text-teal-600">成人審稿工具｜不寫入孩子進度</p>
            <h1 className="text-xl font-black">古文 MD 實際題目預覽</h1>
          </div>
          <label className="text-xs font-bold text-slate-500">
            教材
            <select
              value={sourceIndex ?? ''}
              onChange={(event) => chooseSource(Number(event.target.value))}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {sourceIndex === undefined && <option value="" disabled>找不到指定教材</option>}
              {DRAFT_SOURCES.map((item, index) => <option key={item.lessonId} value={index}>{item.title}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">
            題目
            <select
              value={questionIndex}
              onChange={(event) => chooseQuestion(Number(event.target.value))}
              disabled={!questions.length}
              className="mt-1 block max-w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {questions.map((item, index) => (
                <option key={`${item.number}-${item.line}`} value={index}>
                  第 {item.number} 題｜{item.title} {item.status ? `（${item.status}）` : ''}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void loadLatest()} disabled={!source} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
            ↻ 重新讀取 GitHub
          </button>
        </div>
      </header>

      {loading && <p className="mx-auto max-w-7xl p-8 text-center text-slate-500">正在讀取 GitHub 分支上的 MD……</p>}
      {error && <p className="mx-auto mt-8 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">讀取失敗：{error}</p>}

      {!loading && question && source && (
        <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-teal-100 px-2.5 py-1 font-bold text-teal-700">
                GitHub MD：{questions.length} 題／{approvedCount} 題標示核准
              </span>
              <span className="text-slate-400">讀取時間：{loadedAt?.toLocaleTimeString('zh-TW')}</span>
            </div>

            <div className="mx-auto max-w-2xl space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">第 {question.number} 題｜{question.status || '未標示狀態'}</p>
                    <h2 className="text-lg font-black text-slate-800">{question.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePlayback('whole-page', '依頁面順序全部播放', order.map((item) => item.text))}
                    className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                  >
                    {playback?.id === 'whole-page'
                      ? (playback.paused ? '▶️ 繼續整頁播放' : '⏸ 暫停整頁播放')
                      : '🔊 依頁面順序全部播放'}
                  </button>
                </div>

                {question.target && (
                  <div className="mb-4 text-center">
                    <p className="text-xs text-slate-400">待破解的目標句</p>
                    <AudioLine field={question.target} id="target" label="目標句" activePlayback={playback} onToggle={togglePlayback} className="mt-1 justify-center text-lg font-semibold" />
                  </div>
                )}

                {question.intro && <AudioLine field={question.intro} id="intro" label="引導語" activePlayback={playback} onToggle={togglePlayback} className="mb-4 justify-center text-center text-sm text-slate-600" />}

                {!!question.preAnswerKeys.length && (
                  <div className="mb-4">
                    <GuwenKeyList
                      keys={question.preAnswerKeys.map((key) => ({
                        code: key.code.text,
                        decodedEvidence: key.decodedEvidence.text,
                      }))}
                      heading="🔑 作答前可見的密碼鑰匙"
                      onPlay={(key, index) => togglePlayback(
                        `pre-answer-key-${index}`,
                        `密碼鑰匙 ${index + 1}`,
                        [key.code, key.decodedEvidence],
                      )}
                    />
                  </div>
                )}

                {!!question.clues.length && (
                  <div className="mb-4">
                    <GuwenClueList
                      clues={question.clues.map((clue, index) => ({
                        text: clue.text,
                        pronunciationCue: clue.pronunciationCues?.length ? (
                          <div className="space-y-1.5">
                            {clue.pronunciationCues.map((cue, cueIndex) => (
                              <AudioLine
                                key={`${cue}-${cueIndex}`}
                                field={{ text: cue, heading: '讀音提示', line: clue.line }}
                                id={`clue-${index}-cue-${cueIndex}`}
                                label={`線索 ${index + 1} 讀音提示`}
                                activePlayback={playback}
                                onToggle={togglePlayback}
                                className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800"
                              />
                            ))}
                          </div>
                        ) : undefined,
                        meaning: clue.meaning ? (
                          <AudioLine
                            field={clue.meaning}
                            id={`clue-${index}-meaning`}
                            label={`線索 ${index + 1} 已破解為`}
                            activePlayback={playback}
                            onToggle={togglePlayback}
                            className="pl-1 text-xs text-slate-500"
                          />
                        ) : undefined,
                        source: clue.source?.text,
                      }))}
                      onPlayClue={(text, index) => togglePlayback(
                        `clue-${index}`,
                        `線索 ${index + 1}`,
                        [text, ...(question.clues[index].pronunciationCues ?? [])],
                      )}
                    />
                  </div>
                )}

                {question.question && <AudioLine field={question.question} id="question" label="提問" activePlayback={playback} onToggle={togglePlayback} className="mb-3 justify-center text-center text-sm font-semibold" />}

                {question.kind === 'sequence' && (
                  <div className="space-y-2" data-preview-question-kind="sequence">
                    <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                      正式孩子端可按住右側的 ⠿ 上下拖曳；成人預覽以作答狀態模擬排列結果。
                    </p>
                    {(previewState === 'correct'
                      ? question.sequenceCorrectOrder
                          .map((id) => question.sequenceCards.find((card) => card.id === id))
                          .filter((card): card is DraftQuestion['sequenceCards'][number] => Boolean(card))
                      : question.sequenceCards
                    ).map((card, index) => (
                      <GuwenSequenceCardRow
                        key={card.id}
                        position={index + 1}
                        text={card.text}
                        onPlay={() => togglePlayback(`sequence-${card.id}`, `事件卡 ${index + 1}`, [card.text])}
                        handle={<span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-indigo-200 bg-white text-2xl text-indigo-600">⠿</span>}
                      />
                    ))}
                  </div>
                )}

                {question.kind === 'multiselect' && (
                  <div data-preview-question-kind="multiselect">
                    <GuwenMultiSelectList
                      options={question.multiSelectOptions}
                      selected={new Set(
                        previewState === 'correct'
                          ? question.multiSelectOptions.flatMap((option, index) => option.correct ? [index] : [])
                          : previewState === 'wrong' ? [0, 1] : [],
                      )}
                      solved={previewState === 'correct'}
                      onPlay={(option, index) => togglePlayback(`multi-${index}`, `勾選項目 ${index + 1}`, [option])}
                    />
                    {previewState !== 'correct' && (
                      <button type="button" className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white">
                        提交判斷
                      </button>
                    )}
                  </div>
                )}

                {question.kind === 'causal' && previewState === 'correct' && question.causalNodes.length > 0 && (
                  <GuwenCausalNodes
                    nodes={question.causalNodes.map((node) => node.text)}
                    onPlay={(node, index) => togglePlayback(`causal-${index}`, `因果階段 ${index + 1}`, [node])}
                  />
                )}

                {!['sequence', 'multiselect'].includes(question.kind) && (
                  <GuwenChoiceList
                    options={question.options.map((option) => option.text)}
                    correctIndex={question.correctIndex}
                    wrongIndex={previewState === 'wrong' ? (question.correctIndex === 0 ? 1 : 0) : null}
                    revealCorrect={previewState === 'correct'}
                    readOnly
                    labels={question.kind === 'causal' ? 'letter' : 'number'}
                    onPlay={(option, index) => togglePlayback(`option-${index}`, `選項 ${index + 1}`, [option])}
                  />
                )}

                {previewState === 'wrong' && question.retryHint && (
                  <AudioLine field={question.retryHint} id="retry-hint" label="答錯提示" activePlayback={playback} onToggle={togglePlayback} className="mt-3 justify-center text-center text-sm text-red-500" />
                )}

                {previewState === 'correct' && (
                  <div className="mt-4 space-y-4">
                    <GuwenCoreFeedbackBlock sourceLabel="MD：答對回饋">
                      {question.correctFeedback ? (
                        <AudioLine
                          field={question.correctFeedback}
                          id="correct-feedback"
                          label="核心解答"
                          activePlayback={playback}
                          onToggle={togglePlayback}
                          className="font-bold text-emerald-800"
                        />
                      ) : (
                        <p className="text-sm font-bold text-red-600">⚠ MD 沒有可顯示的「答對回饋」</p>
                      )}
                    </GuwenCoreFeedbackBlock>

                    <GuwenExplanationBlock>
                      {question.explanation ? (
                        <AudioLine
                          field={question.explanation}
                          id="explanation"
                          label="詳解"
                          activePlayback={playback}
                          onToggle={togglePlayback}
                          className="text-sm leading-relaxed text-sky-950"
                        />
                      ) : (
                        <p className="text-sm text-slate-500">本題 MD 沒有另外提供詳解。</p>
                      )}
                    </GuwenExplanationBlock>

                    {question.key && (
                      <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                        <h3 className="mb-3 text-sm font-black text-amber-800">本題取得的密碼鑰匙</h3>
                        <AudioLine
                          field={question.key}
                          id="key"
                          label="本題取得的密碼鑰匙"
                          activePlayback={playback}
                          onToggle={togglePlayback}
                          className="text-sm font-bold text-indigo-700"
                        />
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow">
              <h3 className="font-black">切換作答畫面</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ['answering', '作答前'],
                  ['wrong', '第一次答錯'],
                  ['correct', '答對後'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => choosePreviewState(value)}
                    className={`rounded-lg px-2 py-2 text-xs font-bold ${previewState === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow">
              <h3 className="font-black">MD 抓取檢查</h3>
              {question.diagnostics.length ? (
                <ul className="mt-2 space-y-1 text-sm text-red-600">
                  {question.diagnostics.map((diagnostic) => <li key={diagnostic}>⚠ {diagnostic}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm font-bold text-emerald-600">✓ 題目主要欄位完整</p>
              )}
              <a
                href={githubEditUrl(source, question.line)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-bold text-sky-700 underline"
              >
                在 GitHub 查看這一題（第 {question.line} 行）↗
              </a>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow">
              <h3 className="font-black">實際排列與朗讀順序</h3>
              <ol className="mt-2 space-y-1 text-xs text-slate-600">
                {order.map((item, index) => <li key={`${item.label}-${index}`}>{index + 1}. {item.label}</li>)}
              </ol>
            </div>

            <div className={`rounded-2xl p-4 shadow ${repetitions.length ? 'border border-amber-300 bg-amber-50' : 'bg-white'}`}>
              <h3 className="font-black">相鄰重複提醒</h3>
              {repetitions.length ? (
                <ul className="mt-2 space-y-2 text-sm text-amber-800">
                  {repetitions.map((warning, index) => (
                    <li key={`${warning.first}-${warning.second}-${index}`}>
                      ⚠「{warning.first}」→「{warning.second}」：{warning.reason}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-emerald-600">✓ 沒有偵測到緊鄰的明顯重複</p>}
            </div>

            <p className="px-1 text-xs leading-relaxed text-slate-500">
              這是成人草稿預覽，直接讀取 GitHub 分支上的 MD，使用與正式 App 相同的瀏覽器 TTS 處理；不會寫入進度、金幣、星星或徽章。正式 App 仍只在你明確核准後同步。
            </p>
          </aside>
        </div>
      )}

      {playback && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-sky-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
            {playback.paused ? '已暫停：' : '正在播放：'}{playback.label}
          </span>
          <button type="button" onClick={togglePause} className="rounded-lg bg-sky-100 px-3 py-2 text-sm font-bold text-sky-700">
            {playback.paused ? '▶️ 繼續' : '⏸ 暫停'}
          </button>
          <button type="button" onClick={stopPlayback} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
            ⏹ 停止
          </button>
        </div>
      )}
    </main>
  );
}
