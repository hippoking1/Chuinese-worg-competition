export const INITIALS = ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'];
export const MEDIALS = ['ㄧ','ㄨ','ㄩ'];
export const FINALS = ['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'];
export const ALL_ZHUYIN_SYMBOLS = [...INITIALS, ...MEDIALS, ...FINALS];

export interface DecomposedZhuyin {
  neutral: boolean;      // ˙
  initial?: string;      // ㄅ - ㄙ
  medial?: string;       // ㄧ, ㄨ, ㄩ
  final?: string;        // ㄚ - ㄦ
  tone: 1 | 2 | 3 | 4 | 0; // 0: ˙, 1: 無聲調, 2: ˊ, 3: ˇ, 4: ˋ
  raw: string;
}

export function parseZhuyin(input: string): DecomposedZhuyin {
  const str = input.trim();
  let neutral = false;
  let tone: 1 | 2 | 3 | 4 | 0 = 1;
  const symbols: string[] = [];

  for (const ch of str) {
    if (ch === '˙') {
      neutral = true;
      tone = 0;
    } else if (ch === 'ˊ') {
      tone = 2;
    } else if (ch === 'ˇ') {
      tone = 3;
    } else if (ch === 'ˋ') {
      tone = 4;
    } else if (ALL_ZHUYIN_SYMBOLS.includes(ch)) {
      symbols.push(ch);
    }
  }

  let initial: string | undefined;
  let medial: string | undefined;
  let final: string | undefined;

  for (const s of symbols) {
    if (INITIALS.includes(s) && !initial) {
      initial = s;
    } else if (MEDIALS.includes(s) && !medial) {
      medial = s;
    } else if (FINALS.includes(s) && !final) {
      final = s;
    }
  }

  return { neutral, initial, medial, final, tone, raw: str };
}

/**
 * Standardize Zhuyin string representation
 * Canonical format: optional leading '˙' followed by symbols followed by tone 'ˊ'/'ˇ'/'ˋ'
 */
export function normalizeZhuyin(input: string): string {
  if (!input) return '';
  const d = parseZhuyin(input);
  const parts: string[] = [];
  if (d.neutral) parts.push('˙');
  if (d.initial) parts.push(d.initial);
  if (d.medial) parts.push(d.medial);
  if (d.final) parts.push(d.final);
  if (d.tone === 2) parts.push('ˊ');
  else if (d.tone === 3) parts.push('ˇ');
  else if (d.tone === 4) parts.push('ˋ');
  return parts.join('');
}
