import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';

export type GuwenDisplayKey = {
  code: string;
  decodedEvidence: string;
};

export type GuwenDisplayClue = {
  text: string;
  highlight?: string;
  pronunciationCue?: ReactNode;
  meaning?: ReactNode;
  source?: string;
};

type PlayHandler = (text: string, index: number) => void;

export function GuwenHighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) {
  const marked = highlight && !text.includes(`【${highlight}】`)
    ? text.replace(highlight, `【${highlight}】`)
    : text;
  const parts = marked.split(/(【[^】]+】)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^【.*】$/.test(part)
          ? <strong key={`${part}-${index}`} className="font-bold text-indigo-600">{part}</strong>
          : part,
      )}
    </>
  );
}

export function GuwenKeyList({
  keys,
  onPlay,
  heading = '🔑 已取得的密碼鑰匙',
}: {
  keys: GuwenDisplayKey[];
  onPlay?: (key: GuwenDisplayKey, index: number) => void;
  heading?: string;
}) {
  return (
    <div className="space-y-2" data-guwen-block="keys">
      <p className="text-xs font-semibold text-gray-500">{heading}</p>
      {keys.map((key, index) => (
        <div
          key={`${key.code}-${key.decodedEvidence}-${index}`}
          className="flex items-start gap-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3"
        >
          {onPlay && (
            <button
              type="button"
              onClick={() => onPlay(key, index)}
              aria-label={`播放密碼鑰匙 ${index + 1}`}
              className="shrink-0 text-sky-500"
            >
              🔊
            </button>
          )}
          <span className="shrink-0 font-bold text-amber-700"><GuwenHighlightedText text={key.code} /></span>
          <span className="shrink-0 text-gray-400">＝</span>
          <span className="text-sm text-gray-700"><GuwenHighlightedText text={key.decodedEvidence} /></span>
        </div>
      ))}
    </div>
  );
}

export function GuwenClueList({
  clues,
  onPlayClue,
  startIndex = 0,
}: {
  clues: GuwenDisplayClue[];
  onPlayClue?: PlayHandler;
  startIndex?: number;
}) {
  return (
    <div className="space-y-2" data-guwen-block="clues">
      {clues.map((clue, index) => (
        <div key={`${clue.text}-${index}`} className="space-y-1.5 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-black text-gray-400">線索 {startIndex + index + 1}</p>
          <div className="flex items-start gap-2">
            {onPlayClue && (
              <button
                type="button"
                onClick={() => onPlayClue(clue.text, index)}
                aria-label={`播放線索 ${startIndex + index + 1}`}
                className="shrink-0 text-sky-500"
              >
                🔊
              </button>
            )}
            <p className="font-medium text-gray-800">
              <GuwenHighlightedText text={clue.text} highlight={clue.highlight} />
            </p>
          </div>
          {clue.pronunciationCue}
          {clue.meaning}
          {clue.source ? (
            <p className="whitespace-pre-line border-t border-gray-200 pt-2 text-[11px] leading-relaxed text-gray-400">
              出處：{clue.source}
            </p>
          ) : (
            <p className="border-t border-red-100 pt-2 text-[11px] font-bold text-red-400">
              ⚠ MD 尚未抓到這條線索的出處
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function GuwenChoiceList({
  options,
  correctIndex,
  wrongIndex,
  revealCorrect = false,
  readOnly = false,
  labels = 'number',
  onChoose,
  onPlay,
}: {
  options: string[];
  correctIndex?: number;
  wrongIndex?: number | null;
  revealCorrect?: boolean;
  readOnly?: boolean;
  labels?: 'number' | 'letter';
  onChoose?: (index: number) => void;
  onPlay?: PlayHandler;
}) {
  return (
    <div className="space-y-2" data-guwen-block="choices">
      {options.map((option, index) => {
        const correct = revealCorrect && index === correctIndex;
        const wrong = wrongIndex === index;
        const label = labels === 'letter' ? String.fromCharCode(65 + index) : String(index + 1);
        return (
          <div
            key={`${option}-${index}`}
            role={!readOnly && onChoose ? 'button' : undefined}
            tabIndex={!readOnly && onChoose ? 0 : undefined}
            onClick={!readOnly && onChoose ? () => onChoose(index) : undefined}
            onKeyDown={!readOnly && onChoose
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onChoose(index);
                  }
                }
              : undefined}
            className={`flex w-full items-start gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
              !readOnly && onChoose ? 'cursor-pointer' : 'cursor-default'
            } ${
              correct
                ? 'border-emerald-400 bg-emerald-50'
                : wrong
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-indigo-300'
            }`}
          >
            {onPlay && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPlay(option, index);
                }}
                aria-label={`播放選項 ${index + 1}`}
                className="shrink-0 text-sky-500"
              >
                🔊
              </button>
            )}
            <span className="shrink-0 font-bold text-gray-400">{label}{labels === 'number' ? '.' : ''}</span>
            <p className="flex-1 text-gray-800">{option}</p>
            {correct && <span className="ml-auto shrink-0 text-xs font-bold text-emerald-600">✓ 正解</span>}
          </div>
        );
      })}
    </div>
  );
}

export function GuwenSequenceCardRow({
  position,
  text,
  active = false,
  onPlay,
  handle,
  outerRef,
  style,
  containerProps,
}: {
  position: number;
  text: string;
  active?: boolean;
  onPlay?: () => void;
  handle?: ReactNode;
  outerRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  containerProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style' | 'children'>;
}) {
  return (
    <div
      ref={outerRef}
      style={style}
      {...containerProps}
      data-guwen-block="sequence-card"
      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 select-none ${
        active
          ? 'relative z-20 border-indigo-400 bg-indigo-50 shadow-xl'
          : 'border-gray-200 bg-gray-50 transition-[transform,box-shadow,border-color]'
      }`}
    >
      <span className="w-5 shrink-0 text-center font-bold text-gray-400">{position}</span>
      {onPlay && (
        <button type="button" onClick={onPlay} aria-label={`播放第 ${position} 張事件卡`} className="shrink-0 text-sky-500">
          🔊
        </button>
      )}
      <p className="flex-1 text-sm text-gray-800">{text}</p>
      {handle}
    </div>
  );
}

export type GuwenMultiSelectOption = {
  text: string;
  correct?: boolean;
  detail?: string;
};

export function GuwenMultiSelectList({
  options,
  selected,
  solved = false,
  onToggle,
  onPlay,
}: {
  options: GuwenMultiSelectOption[];
  selected: ReadonlySet<number>;
  solved?: boolean;
  onToggle?: (index: number) => void;
  onPlay?: PlayHandler;
}) {
  return (
    <div className="space-y-2" data-guwen-block="multiselect">
      {options.map((option, index) => (
        <label
          key={`${option.text}-${index}`}
          className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 ${
            solved || !onToggle ? 'cursor-default' : 'cursor-pointer'
          } ${selected.has(index) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
        >
          <input
            type="checkbox"
            checked={selected.has(index)}
            disabled={solved || !onToggle}
            onChange={() => onToggle?.(index)}
            className="mt-1"
          />
          <span className="flex-1 text-sm text-gray-800">{option.text}</span>
          {onPlay && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onPlay(option.text, index);
              }}
              aria-label={`播放勾選項目 ${index + 1}`}
              className="shrink-0 text-sky-500"
            >
              🔊
            </button>
          )}
        </label>
      ))}
    </div>
  );
}

export function GuwenAssistedAnswerButton({
  label,
  onReveal,
}: {
  label: string;
  onReveal: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onReveal}
      className="w-full rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 font-bold text-amber-800 hover:bg-amber-100"
    >
      {label}
    </button>
  );
}

export function GuwenCausalNodes({
  nodes,
  onPlay,
}: {
  nodes: string[];
  onPlay?: PlayHandler;
}) {
  return (
    <div className="space-y-1" data-guwen-block="causal-chain">
      {nodes.map((node, index) => (
        <div key={`${node}-${index}`}>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            {onPlay && (
              <button type="button" onClick={() => onPlay(node, index)} aria-label={`播放因果階段 ${index + 1}`} className="shrink-0 text-sky-500">
                🔊
              </button>
            )}
            <p className="flex-1 text-sm text-gray-800">{node}</p>
          </div>
          {index < nodes.length - 1 && <p className="text-center text-gray-300">↓</p>}
        </div>
      ))}
    </div>
  );
}

export function GuwenCoreFeedbackBlock({
  children,
  action,
  sourceLabel,
}: {
  children: ReactNode;
  action?: ReactNode;
  sourceLabel?: string;
}) {
  return (
    <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4" data-guwen-block="core-feedback">
      <h3 className="mb-3 text-sm font-black text-emerald-700">
        核心解答
        {sourceLabel && <span className="ml-2 text-xs font-bold text-emerald-500">{sourceLabel}</span>}
      </h3>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 font-bold text-emerald-800">{children}</div>
        {action}
      </div>
    </section>
  );
}

export function GuwenExplanationBlock({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border-2 border-sky-200 bg-sky-50 p-4" data-guwen-block="explanation">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-black text-sky-800">詳解</h3>
        {action}
      </div>
      <div className="text-sm leading-relaxed text-sky-950">{children}</div>
    </section>
  );
}
