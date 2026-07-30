import type { CSSProperties } from 'react';
import {
  CUBE_CHARACTER_COUNT,
  SQUARE_CHARACTER_COUNT,
  characterColor,
  maxExponentForBase,
  parseCharacterId,
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
 * power characters are filled circles, square characters are filled squares,
 * and cube characters are filled triangles. Every collection keeps its rainbow color progression.
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
    : parsed.kind === 'square'
      ? parsed.squareBase
      : parsed.cubeBase;
  const max = parsed.kind === 'power'
    ? maxExponentForBase(parsed.base)
    : parsed.kind === 'square'
      ? SQUARE_CHARACTER_COUNT
      : CUBE_CHARACTER_COUNT;
  const shapeClass = parsed.kind === 'power'
    ? 'rounded-full'
    : parsed.kind === 'square'
      ? 'rounded-lg'
      : '';
  const shapeStyle: CSSProperties = {
    backgroundColor: characterColor(number, max),
    ...(parsed.kind === 'cube'
      ? { clipPath: 'polygon(50% 3%, 98% 94%, 2% 94%)' }
      : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} ${shapeClass} flex items-center justify-center font-extrabold text-white shadow-inner ${className}`}
      style={shapeStyle}
    >
      <span className={parsed.kind === 'cube' ? 'translate-y-[18%]' : undefined}>{number}</span>
    </div>
  );
}
