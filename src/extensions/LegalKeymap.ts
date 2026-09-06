import { Extension, textInputRule } from '@tiptap/core';

export const CIRCLED_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
];

const CIRCLED_MAP: Record<string, number> = {
  '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5, '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
  '⑪': 11, '⑫': 12, '⑬': 13, '⑭': 14, '⑮': 15, '⑯': 16, '⑰': 17, '⑱': 18, '⑲': 19, '⑳': 20
};

export interface LineHierarchyInfo {
  level: number;
  indent: number;
  marker: string;
  content: string;
}

export function parseLineHierarchy(lineText: string, nodeIndent = 0): LineHierarchyInfo {
  const cleanText = lineText.replace(/^([ \u00a0]|&nbsp;)+/, '').trim();
  const indent = nodeIndent;

  // Level 8: a) ~ z)
  const l8 = cleanText.match(/^([a-z]\))\s*(.*)$/);
  if (l8) return { level: 8, indent, marker: l8[1], content: l8[2] };

  // Level 7: 가) ~ 하)
  const l7 = cleanText.match(/^([가-하]\))\s*(.*)$/);
  if (l7) return { level: 7, indent, marker: l7[1], content: l7[2] };

  // Level 6: 1) ~ 99)
  const l6 = cleanText.match(/^(\d+\))\s*(.*)$/);
  if (l6) return { level: 6, indent, marker: l6[1], content: l6[2] };

  // Level 5: ① ~ ⑳
  const l5 = cleanText.match(/^([①-⑳])\s*(.*)$/);
  if (l5) return { level: 5, indent, marker: l5[1], content: l5[2] };

  // Level 4: (가) ~ (하)
  const l4 = cleanText.match(/^(\([가-하]\))\s*(.*)$/);
  if (l4) return { level: 4, indent, marker: l4[1], content: l4[2] };

  // Level 3: (1) ~ (99)
  const l3 = cleanText.match(/^(\(\d+\))\s*(.*)$/);
  if (l3) return { level: 3, indent, marker: l3[1], content: l3[2] };

  // Level 2: 가. ~ 하.
  const l2 = cleanText.match(/^([가-하]\.)\s*(.*)$/);
  if (l2) return { level: 2, indent, marker: l2[1], content: l2[2] };

  // Level 1: 1. ~ 99.
  const l1 = cleanText.match(/^(\d+\.)\s*(.*)$/);
  if (l1) return { level: 1, indent, marker: l1[1], content: l1[2] };

  return { level: 0, indent, marker: '', content: cleanText };
}

export function extractMarkerNumber(marker: string, level: number): number {
  if (level === 1 || level === 3 || level === 6) {
    const num = parseInt(marker.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 1 : num;
  }
  if (level === 2 || level === 4 || level === 7) {
    const ch = marker.replace(/[^가-하]/g, '').trim();
    return ch ? ch.charCodeAt(0) - '가'.charCodeAt(0) + 1 : 1;
  }
  if (level === 5) {
    const ch = marker.trim();
    return CIRCLED_MAP[ch] || 1;
  }
  if (level === 8) {
    const ch = marker.replace(/[^a-z]/g, '').trim();
    return ch ? ch.charCodeAt(0) - 'a'.charCodeAt(0) + 1 : 1;
  }
  return 1;
}

export function getMarkerForLevelAndNumber(level: number, num: number): string {
  const safeNum = Math.max(1, num);
  switch (level) {
    case 1: return `${safeNum}. `;
    case 2: return `${String.fromCharCode('가'.charCodeAt(0) + safeNum - 1)}. `;
    case 3: return `(${safeNum}) `;
    case 4: return `(${String.fromCharCode('가'.charCodeAt(0) + safeNum - 1)}) `;
    case 5: return `${CIRCLED_NUMBERS[safeNum - 1] || '①'} `;
    case 6: return `${safeNum}) `;
    case 7: return `${String.fromCharCode('가'.charCodeAt(0) + safeNum - 1)}) `;
    case 8: return `${String.fromCharCode('a'.charCodeAt(0) + safeNum - 1)}) `;
    default: return '';
  }
}

export function getNextSiblingMarker(marker: string, level: number): string {
  const currentNum = extractMarkerNumber(marker, level);
  return getMarkerForLevelAndNumber(level, currentNum + 1);
}

/**
 * 상대적 계층 전개 엔진
 * - 모든 텍스트 앞 공백 문자(&nbsp;, space)를 전면 제거
 * - 문단 태그 자체에 data-indent 속성을 부여하여 줄바꿈 시에도 둘째 줄 시작선 고정
 */
export function adaptSnippetHierarchy(
  snippetTitle: string,
  rawItems: string[],
  prevLineText: string,
  prevIndent = 0
): { titleHtml: string; itemsHtml: string[] } {
  const prevInfo = parseLineHierarchy(prevLineText, prevIndent);

  let baseLevel = 1;
  let baseIndent = 0;

  if (prevInfo.level > 0) {
    baseLevel = Math.min(prevInfo.level + 1, 8);
    baseIndent = prevInfo.indent + 1;
  }

  const pureTitle = snippetTitle.replace(/^\d+\.\s*/, '').replace(/^([ \u00a0]|&nbsp;)+/, '').trim();
  const adjustedTitleMarker = getMarkerForLevelAndNumber(baseLevel, 1);
  const titleHtml = `<p data-indent="${baseIndent}" class="legal-indent-${baseIndent}"><strong>${adjustedTitleMarker}${pureTitle}</strong></p>`;

  const parsedItems = rawItems.map((item) => {
    const cleanItem = item.replace(/^([ \u00a0]|&nbsp;)+/, '').trim();
    return {
      raw: cleanItem,
      info: parseLineHierarchy(cleanItem, 0),
    };
  });

  const validLevels = parsedItems.map((p) => p.info.level).filter((lvl) => lvl > 0);
  const minSnippetLevel = validLevels.length > 0 ? Math.min(...validLevels) : 1;

  const itemsHtml = parsedItems.map(({ raw, info }) => {
    if (info.level > 0) {
      const originalNum = extractMarkerNumber(info.marker, info.level);
      const itemDepth = Math.max(0, info.level - minSnippetLevel);
      const targetLevel = Math.min(baseLevel + 1 + itemDepth, 8);
      const targetMarker = getMarkerForLevelAndNumber(targetLevel, originalNum);
      const targetIndent = baseIndent + 1 + itemDepth;

      return `<p data-indent="${targetIndent}" class="legal-indent-${targetIndent}">${targetMarker}${info.content}</p>`;
    }

    const fallbackIndent = baseIndent + 1;
    return `<p data-indent="${fallbackIndent}" class="legal-indent-${fallbackIndent}">${raw}</p>`;
  });

  return { titleHtml, itemsHtml };
}

export const LegalFormatExtension = Extension.create({
  name: 'legalFormat',
  priority: 1000,

  // Paragraph 스키마에 indent 속성을 정식 글로벌 애트리뷰트로 영구 바인딩[cite: 3]
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const dataIndent = element.getAttribute('data-indent');
              if (dataIndent) return parseInt(dataIndent, 10);
              const ml = element.style.marginLeft;
              if (ml) {
                const px = parseInt(ml, 10);
                return isNaN(px) ? 0 : Math.round(px / 24);
              }
              return 0;
            },
            renderHTML: (attributes) => {
              const indent = attributes.indent || 0;
              if (!indent) return {};
              return {
                'data-indent': String(indent),
                class: `legal-indent-${indent}`,
              };
            },
          },
        },
      },
    ];
  },

  addInputRules() {
    return [
      textInputRule({ find: /\(\(1\)\)\s$/, replace: '① ' }),
      textInputRule({ find: /\(\(2\)\)\s$/, replace: '② ' }),
      textInputRule({ find: /\(\(3\)\)\s$/, replace: '③ ' }),
      textInputRule({ find: /\(\(4\)\)\s$/, replace: '④ ' }),
      textInputRule({ find: /\(\(5\)\)\s$/, replace: '⑤ ' }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const currentNode = $from.parent;
        const currentLine = currentNode.textContent;
        const currentIndent = currentNode.attrs.indent || 0;

        const info = parseLineHierarchy(currentLine, currentIndent);

        if (info.level > 0 && info.level < 8) {
          const nextLevel = info.level + 1;
          const currentNum = extractMarkerNumber(info.marker, info.level);
          const nextMarker = getMarkerForLevelAndNumber(nextLevel, currentNum);
          const nextIndent = currentIndent + 1;

          return this.editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup($from.before(), undefined, {
                ...currentNode.attrs,
                indent: nextIndent,
              });
              tr.replaceWith($from.start(), $from.end(), state.schema.text(`${nextMarker}${info.content}`));
              return true;
            })
            .run();
        }

        return this.editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup($from.before(), undefined, {
              ...currentNode.attrs,
              indent: currentIndent + 1,
            });
            return true;
          })
          .run();
      },

      'Shift-Tab': () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const currentNode = $from.parent;
        const currentLine = currentNode.textContent;
        const currentIndent = currentNode.attrs.indent || 0;

        const info = parseLineHierarchy(currentLine, currentIndent);

        if (info.level > 1) {
          const prevLevel = info.level - 1;
          const currentNum = extractMarkerNumber(info.marker, info.level);
          const prevMarker = getMarkerForLevelAndNumber(prevLevel, currentNum);
          const prevIndent = Math.max(0, currentIndent - 1);

          return this.editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup($from.before(), undefined, {
                ...currentNode.attrs,
                indent: prevIndent,
              });
              tr.replaceWith($from.start(), $from.end(), state.schema.text(`${prevMarker}${info.content}`));
              return true;
            })
            .run();
        }

        if (currentIndent > 0) {
          return this.editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup($from.before(), undefined, {
                ...currentNode.attrs,
                indent: currentIndent - 1,
              });
              return true;
            })
            .run();
        }

        return false;
      },

      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;

        const currentNode = $from.parent;
        if (currentNode.type.name !== 'paragraph') return false;

        const currentIndent = currentNode.attrs.indent || 0;
        const textBeforeCursor = currentNode.textBetween(0, $from.parentOffset, undefined, '\n');
        const textAfterCursor = currentNode.textBetween($from.parentOffset, currentNode.content.size, undefined, '\n');

        const lastNl = textBeforeCursor.lastIndexOf('\n');
        const lineBefore = lastNl !== -1 ? textBeforeCursor.slice(lastNl + 1) : textBeforeCursor;

        const nextNl = textAfterCursor.indexOf('\n');
        const lineAfter = nextNl !== -1 ? textAfterCursor.slice(0, nextNl) : textAfterCursor;

        const fullLine = lineBefore + lineAfter;
        const isAtLineEnd = lineAfter.trim() === '';
        const info = parseLineHierarchy(fullLine, currentIndent);

        // 빈 기호 줄 탈출 (기호 삭제 및 1단계 내어쓰기)
        if (info.level > 0 && info.content.trim() === '') {
          return this.editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.delete($from.start(), $from.end());
              tr.setNodeMarkup($from.before(), undefined, {
                ...currentNode.attrs,
                indent: Math.max(0, currentIndent - 1),
              });
              return true;
            })
            .run();
        }

        if (!isAtLineEnd) return false;

        // 동위 계층 자동 증분
        if (info.level > 0) {
          const nextMarker = getNextSiblingMarker(info.marker, info.level);
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr, state: newState }) => {
              const newPos = newState.selection.$from.before();
              tr.setNodeMarkup(newPos, undefined, {
                ...currentNode.attrs,
                indent: currentIndent,
              });
              tr.insertText(nextMarker);
              return true;
            })
            .run();
        }

        if (currentIndent > 0) {
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr, state: newState }) => {
              const newPos = newState.selection.$from.before();
              tr.setNodeMarkup(newPos, undefined, {
                ...currentNode.attrs,
                indent: currentIndent,
              });
              return true;
            })
            .run();
        }

        return false;
      },
    };
  },
});