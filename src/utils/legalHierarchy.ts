import type { SlashMenuItem } from '../components/SlashMenu';

export interface LineContext {
  rawLine: string;
  baseIndent: string;
  indentLevel: number;
  detectedSymbol: string | null;
  detectedLevel: number | null; // 1 ~ 8
  trimmedContent: string;
}

// 표준 법률 8단계 목차 정규식 매핑
const HIERARCHY_PATTERNS = [
  { level: 1, regex: /^(\d+)\.\s*/ },                  // 1. 2. (중목차)
  { level: 2, regex: /^([가-하])\.\s*/ },               // 가. 나. (소목차)
  { level: 3, regex: /^\((\d+)\)\s*/ },                 // (1) (2) (1차 항)
  { level: 4, regex: /^\(([가-하])\)\s*/ },             // (가) (나) (1차 목)
  { level: 5, regex: /^([①-⑳])\s*/ },                  // ① ② (호/원문자)
  { level: 6, regex: /^(\d+)\)\s*/ },                   // 1) 2) (2차 항)
  { level: 7, regex: /^([가-하])\)\s*/ },               // 가) 나) (2차 목)
  { level: 8, regex: /^\((\d+)\)\s*/ },                 // (1) (2) (2차 세목)
];

/**
 * 직전 줄의 문자열을 정밀 분석하여 기준 들여쓰기 및 계층 레벨을 파악합니다.
 */
export function analyzeLineContext(lineText: string): LineContext {
  const leadingSpacesMatch = lineText.match(/^([ \u00a0]*)/);
  const baseIndent = leadingSpacesMatch ? leadingSpacesMatch[1].replace(/ /g, '\u00a0') : '';
  const textWithoutIndent = lineText.slice(baseIndent.length);

  let detectedSymbol: string | null = null;
  let detectedLevel: number | null = null;
  let trimmedContent = textWithoutIndent;

  for (const item of HIERARCHY_PATTERNS) {
    const match = textWithoutIndent.match(item.regex);
    if (match) {
      detectedSymbol = match[0].trim();
      detectedLevel = item.level;
      trimmedContent = textWithoutIndent.slice(match[0].length).trim();
      break;
    }
  }

  // 2칸을 1단위 인덴트로 계산
  const indentLevel = Math.floor(baseIndent.length / 2);

  return {
    rawLine: lineText,
    baseIndent,
    indentLevel,
    detectedSymbol,
    detectedLevel,
    trimmedContent,
  };
}

/**
 * 원문자(Level 5) 하위 강등 규칙을 적용한 스니펫 HTML 생성
 */
export function formatSnippetWithRelativeHierarchy(
  snippet: SlashMenuItem,
  context: LineContext
): { html: string; shouldSkipTitle: boolean } {
  const { baseIndent, detectedLevel, trimmedContent } = context;

  // 1단계 상대 인덴트 (+2칸), 2단계 (+4칸), 3단계 (+6칸)
  const step1 = baseIndent + '\u00a0\u00a0';
  const step2 = baseIndent + '\u00a0\u00a0\u00a0\u00a0';
  const step3 = baseIndent + '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0';

  // 직전 줄 표제 일치 검사 (키워드가 이미 존재하는지 확인)
  const cleanSnippetTitle = snippet.snippetTitle.replace(/^[\d가-하IVXⅠ-Ⅻ.()①-⑳\s]+/g, '').trim();
  const shouldSkipTitle =
    trimmedContent.length > 0 &&
    (trimmedContent.includes(cleanSnippetTitle) || cleanSnippetTitle.includes(trimmedContent));

  // 원문자(Level 5) 직계 하위인지 확인 -> 1) -> 가) -> (1) 체계 적용
  const isUnderCircled = detectedLevel === 5;

  let titlePrefix = '1. ';
  let subTitlePrefix = '가. ';

  if (isUnderCircled) {
    titlePrefix = '1) ';
    subTitlePrefix = '가) ';
  }

  // 인라인 조문 스니펫 처리
  if (snippet.isInline) {
    const html = `<p>${step1}<strong>${snippet.snippetTitle}</strong> ${snippet.items.join('&nbsp;&nbsp;')}</p>`;
    return { html, shouldSkipTitle: false };
  }

  const htmlParts: string[] = [];

  // 직전 줄과 제목이 불일치할 때만 표제 생성
  if (!shouldSkipTitle) {
    const titleText = snippet.snippetTitle.replace(/^[\d가-하IVXⅠ-Ⅻ.()①-⑳\s]+/g, '').trim();
    htmlParts.push(`<p>${step1}<strong>${titlePrefix}${titleText}</strong></p>`);
  }

  // 하위 요건사실 및 세부항목 렌더링
  const contentIndent = shouldSkipTitle ? step1 : step2;
  const itemIndent = shouldSkipTitle ? step2 : step3;

  let itemCounter = 1;

  snippet.items.forEach((item) => {
    // 이미 원문자나 소목차가 붙어있는 텍스트 정규화
    let cleanItem = item.replace(/^(&nbsp;|\s)*/g, '');
    const hasCircled = /^[①-⑳]/.test(cleanItem);

    if (hasCircled) {
      if (isUnderCircled) {
        // 원문자 하위에서는 (1), (2) 세목으로 변환
        cleanItem = cleanItem.replace(/^[①-⑳]\s*/, `(${itemCounter}) `);
        itemCounter++;
      }
      htmlParts.push(`<p>${itemIndent}${cleanItem}</p>`);
    } else if (/^[가-하]\./.test(cleanItem)) {
      // 소목차 항목
      if (isUnderCircled) {
        cleanItem = cleanItem.replace(/^[가-하]\.\s*/, subTitlePrefix);
      }
      htmlParts.push(`<p>${contentIndent}${cleanItem}</p>`);
    } else {
      htmlParts.push(`<p>${contentIndent}${cleanItem}</p>`);
    }
  });

  return {
    html: htmlParts.join(''),
    shouldSkipTitle,
  };
}