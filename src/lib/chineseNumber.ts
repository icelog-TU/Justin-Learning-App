const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_SMALL_UNITS = ['', '十', '百', '千'];
/** Groups of 4 digits, largest-first suffix per group (個, 萬, 億, 兆, ...). Covers well beyond 6^33. */
const CN_BIG_UNITS = ['', '萬', '億', '兆', '京', '垓', '秭', '穰', '溝', '澗', '正', '載'];

/** Converts a 0-9999 integer into its Chinese-numeral reading, e.g. 5008 -> "五千零八". */
function convertGroup(n: number, isLeadingGroup: boolean): string {
  const digits = isLeadingGroup ? String(n) : String(n).padStart(4, '0');
  let result = '';
  let pendingZero = false;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits[i]);
    const unitIndex = digits.length - i - 1;
    if (digit === 0) {
      pendingZero = true;
      continue;
    }
    if (pendingZero) {
      result += CN_DIGITS[0];
      pendingZero = false;
    }
    result += CN_DIGITS[digit] + CN_SMALL_UNITS[unitIndex];
  }
  return result;
}

/** Converts a (possibly huge) integer into Chinese numeral words, e.g. 65536 -> "六萬五千五百三十六". */
export function numberToChineseWords(value: bigint | number): string {
  let n = typeof value === 'bigint' ? value : BigInt(value);
  if (n === 0n) return '零';
  const negative = n < 0n;
  if (negative) n = -n;

  const decimalDigits = n.toString();
  // Chinese large-number unit names beyond 載 are uncommon and inconsistently named. For values larger
  // than this table, reading every digit is unambiguous and prevents silently dropping high-order places.
  if (Math.ceil(decimalDigits.length / 4) > CN_BIG_UNITS.length) {
    const spokenDigits = decimalDigits.split('').map((digit) => CN_DIGITS[Number(digit)]).join('、');
    return negative ? `負${spokenDigits}` : spokenDigits;
  }

  const groups: number[] = [];
  while (n > 0n) {
    groups.unshift(Number(n % 10000n));
    n /= 10000n;
  }

  let result = '';
  // Set whenever a whole 4-digit group is skipped (all zero) — needs a single connecting 零
  // before the next nonzero group, but only if that group doesn't already start with one itself.
  let pendingGroupZero = false;
  for (let i = 0; i < groups.length; i++) {
    const groupValue = groups[i];
    const unit = CN_BIG_UNITS[groups.length - 1 - i] ?? '';
    const isLeadingGroup = i === 0;
    if (groupValue === 0) {
      if (!isLeadingGroup) pendingGroupZero = true;
      continue;
    }
    if (pendingGroupZero && groupValue >= 1000) {
      result += '零';
    }
    result += convertGroup(groupValue, isLeadingGroup) + unit;
    pendingGroupZero = false;
  }

  if (result.startsWith('一十')) result = result.slice(1);
  return negative ? '負' + result : result;
}
