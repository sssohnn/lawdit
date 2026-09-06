const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

export function extractChosung(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const chosungIndex = Math.floor((code - HANGUL_START) / 588);
      result += CHOSUNG[chosungIndex];
    } else {
      result += text.charAt(i);
    }
  }
  return result;
}

export function matchKorean(target?: string, query?: string): boolean {
  if (!query) return true;
  if (!target) return false;
  const cleanQuery = query.toLowerCase().trim();
  const cleanTarget = target.toLowerCase();

  if (cleanTarget.includes(cleanQuery)) return true;
  const targetChosung = extractChosung(cleanTarget);
  return targetChosung.includes(cleanQuery);
}