import type { Ink } from '../../types';

/**
 * Call Google Input Tools Handwriting API for Traditional Chinese (zh_TW)
 */
export async function recognizeHanziWithGoogle(ink: Ink, width: number, height: number): Promise<string[]> {
  if (!ink || ink.length === 0) return [];

  try {
    const formattedInk = ink.map(stroke => [
      stroke.map(p => Math.round(p[0])),
      stroke.map(p => Math.round(p[1])),
      stroke.map(p => Math.round(p[2]))
    ]);

    const payload = {
      app_version: 0.4,
      api_level: '533.0.0',
      device: navigator.userAgent,
      input_type: '0',
      options: 'enable_pre_space',
      requests: [
        {
          writing_guide: {
            writing_area_width: Math.round(width),
            writing_area_height: Math.round(height)
          },
          ink: formattedInk,
          language: 'zh_TW'
        }
      ]
    };

    const res = await fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('Google handwriting API responded with status:', res.status);
      return [];
    }

    const data = await res.json();
    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      return data[1][0][1] as string[];
    }
  } catch (err) {
    console.warn('Google handwriting API request failed (falling back to manual check):', err);
  }

  return [];
}

const ZHUYIN_CHAR_MAP: Record<string, string> = {
  'x': 'ㄨ', 'X': 'ㄨ', '×': 'ㄨ', 'Ⅹ': 'ㄨ', 'ⅹ': 'ㄨ',
  'y': 'ㄚ', 'Y': 'ㄚ', '丫': 'ㄚ', '¥': 'ㄚ',
  'c': 'ㄍ', 'C': 'ㄍ', '《': 'ㄍ', '（': 'ㄍ', '(': 'ㄍ',
  'p': 'ㄆ', 'P': 'ㄆ',
  'm': 'ㄇ', 'M': 'ㄇ',
  'f': 'ㄈ', 'F': 'ㄈ',
  't': 'ㄊ', 'T': 'ㄊ', '丁': 'ㄊ',
  'l': 'ㄌ', 'L': 'ㄌ',
  'k': 'ㄎ', 'K': 'ㄎ',
  'h': 'ㄏ', 'H': 'ㄏ', '厂': 'ㄏ',
  'j': 'ㄐ', 'J': 'ㄐ',
  'q': 'ㄑ', 'Q': 'ㄑ',
  'r': 'ㄖ', 'R': 'ㄖ', '日': 'ㄖ',
  'z': 'ㄗ', 'Z': 'ㄗ',
  's': 'ㄙ', 'S': 'ㄙ',
  'u': 'ㄩ', 'U': 'ㄩ', 'ப': 'ㄩ',
  'o': 'ㄛ', 'O': 'ㄛ',
  'e': 'ㄜ', 'E': 'ㄜ',
  'w': 'ㄨ', 'W': 'ㄨ',
  '1': 'ㄧ', '|': 'ㄧ', '一': 'ㄧ', 'I': 'ㄧ', 'i': 'ㄧ',
  '儿': 'ㄦ', '几': 'ㄦ'
};

/**
 * Recognize Zhuyin symbol using Google handwriting with character mapping and slot constraints
 */
export async function recognizeZhuyinWithGoogle(
  ink: Ink,
  width: number,
  height: number,
  allowedSet?: string[]
): Promise<string[]> {
  const rawCands = await recognizeHanziWithGoogle(ink, width, height);
  if (rawCands.length === 0) return [];

  const matched: string[] = [];
  for (const raw of rawCands) {
    const mapped = ZHUYIN_CHAR_MAP[raw] || raw;
    if (!allowedSet || allowedSet.includes(mapped)) {
      if (!matched.includes(mapped)) matched.push(mapped);
    }
  }

  return matched;
}
