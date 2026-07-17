import { useState } from 'react';
import type { Idiom } from '../data/idioms';

export default function IdiomCard({ idiom }: { idiom: Idiom }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="text-left bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5 w-full h-full"
    >
      {!flipped ? (
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <span className="text-3xl font-bold text-orange-600 tracking-wider">{idiom.word}</span>
          <span className="text-xs text-gray-400">點一下看意思 👆</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-lg font-bold text-orange-600">{idiom.word}</p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-500">意思：</span>
            {idiom.meaning}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-500">例句：</span>
            {idiom.example}
          </p>
          {idiom.story && (
            <p className="text-sm text-gray-600 bg-orange-50 rounded-lg p-2">
              <span className="font-semibold text-gray-500">小故事：</span>
              {idiom.story}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
