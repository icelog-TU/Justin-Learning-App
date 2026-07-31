interface LoadMoreButtonProps {
  shown: number;
  total: number;
  batchSize: number;
  onLoadMore: () => void;
  noun: string;
  accentClass?: string;
}

export function LoadMoreButton({
  shown,
  total,
  batchSize,
  onLoadMore,
  noun,
  accentClass = 'text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100',
}: LoadMoreButtonProps) {
  if (shown >= total) return null;
  const nextCount = Math.min(batchSize, total - shown);

  return (
    <button
      type="button"
      onClick={onLoadMore}
      className={`min-h-11 w-full rounded-xl border px-4 py-2 text-sm font-bold ${accentClass}`}
    >
      再顯示 {nextCount} {noun}（還有 {total - shown}）
    </button>
  );
}
