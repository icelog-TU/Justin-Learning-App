import type { CSSProperties } from 'react';
import {
  characterColor,
  getSequenceCollection,
  maxExponentForBase,
  parseCharacterId,
  powerCharacterColor,
} from '../lib/rewards';

type CharacterAvatarSize = 'small' | 'medium' | 'large';

const SIZE_CLASSES: Record<CharacterAvatarSize, string> = {
  small: 'h-10 w-10 text-sm',
  medium: 'h-20 w-20 text-2xl',
  large: 'h-28 w-28 text-3xl',
};

interface CharacterAvatarProps {
  id: string;
  size?: CharacterAvatarSize;
  className?: string;
  style?: CSSProperties;
}

/**
 * Keep all character portraits in one visual system:
 * Every collection uses a simple filled geometric shape and keeps its own rainbow color progression.
 */
export function CharacterAvatar({
  id,
  size = 'small',
  className = '',
  style,
}: CharacterAvatarProps) {
  const parsed = parseCharacterId(id);
  const number = parsed.kind === 'power'
    ? parsed.exponent
    : parsed.index;
  const max = parsed.kind === 'power'
    ? maxExponentForBase(parsed.base)
    : getSequenceCollection(parsed.kind).count;
  const shapeClass = parsed.kind === 'power'
    ? 'rounded-full'
    : parsed.kind === 'square'
      ? 'rounded-lg'
      : '';
  const clipPath = parsed.kind === 'cube'
    ? 'polygon(50% 3%, 98% 94%, 2% 94%)'
    : parsed.kind === 'triangular'
      ? 'polygon(2% 6%, 98% 6%, 50% 97%)'
      : parsed.kind === 'fibonacci'
        ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        : parsed.kind === 'prime'
          ? 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)'
          : parsed.kind === 'factorial'
            ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
            : undefined;
  const shapeStyle: CSSProperties = {
    backgroundColor: parsed.kind === 'power'
      ? powerCharacterColor(number, max)
      : characterColor(number, max),
    ...(clipPath ? { clipPath } : {}),
    ...style,
  };
  const numberPositionClass = parsed.kind === 'cube'
    ? 'translate-y-[18%]'
    : parsed.kind === 'triangular'
      ? '-translate-y-[15%]'
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} ${shapeClass} flex items-center justify-center font-extrabold text-white shadow-inner ${className}`}
      style={shapeStyle}
    >
      <span className={numberPositionClass}>{number}</span>
    </div>
  );
}
