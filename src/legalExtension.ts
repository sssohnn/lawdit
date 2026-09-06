import { Extension, textInputRule } from '@tiptap/core';

// 원문자 매핑 테이블 (1 ~ 20)
const CIRCLED_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
];

const circledMap: Record<string, string> = {
  '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤',
  '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨', '10': '⑩',
};

export const LegalFormatExtension = Extension.create({
  name: 'legalFormat',

  // 기본 단축키보다 먼저 가로채도록 최상위 우선순위 부여
  priority: 1000,

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent * 24}px;` };
            },
            parseHTML: (element) => {
              const left = parseInt(element.style.marginLeft || '0', 10);
              return left ? Math.round(left / 24) : 0;
            },
          },
          hanging: {
            default: false,
            renderHTML: (attributes) => {
              if (!attributes.hanging) return {};
              return { class: 'hanging-indent' };
            },
            parseHTML: (element) => element.classList.contains('hanging-indent'),
          },
        },
      },
    ];
  },

  addInputRules() {
    return Object.entries(circledMap).map(([num, circledChar]) =>
      textInputRule({
        find: new RegExp(`\\(${num}\\)\\s$`),
        replace: `${circledChar} `,
      })
    );
  },

  addKeyboardShortcuts() {
    return {
      // Tab: 들여쓰기 1단계 증가 (최대 10단계까지 허용)
      Tab: () => {
        return this.editor.commands.command(({ tr, state }) => {
          const { from, to } = state.selection;
          let handled = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph') {
              const currentIndent = node.attrs.indent || 0;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: Math.min(currentIndent + 1, 10),
              });
              handled = true;
            }
          });
          return handled;
        });
      },

      // Shift + Tab: 들여쓰기 1단계 감소 (최소 0단계)
      'Shift-Tab': () => {
        return this.editor.commands.command(({ tr, state }) => {
          const { from, to } = state.selection;
          let handled = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph') {
              const currentIndent = node.attrs.indent || 0;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: Math.max(currentIndent - 1, 0),
              });
              handled = true;
            }
          });
          return handled;
        });
      },

      // Enter: 서식 탈출 및 자동 증분 처리
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;

        const currentNode = $from.parent;
        if (currentNode.type.name !== 'paragraph') return false;

        const text = currentNode.textContent;
        const indent = currentNode.attrs.indent || 0;
        const hanging = currentNode.attrs.hanging || false;
        const hasFormatting = indent > 0 || hanging;

        const isOnlyCircled = /^[①-⑳]\s*$/.test(text);
        const isOnlyNumbered = /^\d+\.\s*$/.test(text);
        const isEmptyWithFormat = text.trim() === '' && hasFormatting;

        // 1. 텍스트 없이 서식만 남은 줄에서 Enter -> 줄바꿈하지 않고 들여쓰기/내어쓰기 즉시 리셋
        if (isOnlyCircled || isOnlyNumbered || isEmptyWithFormat) {
          return this.editor.commands.command(({ tr }) => {
            const start = $from.start();
            const end = $from.end();
            if (start < end) {
              tr.delete(start, end);
            }
            tr.setNodeMarkup($from.before(), undefined, {
              ...currentNode.attrs,
              indent: 0,
              hanging: false,
            });
            return true;
          });
        }

        // 2. 항(項) 자동 증분 (① -> ②)
        const circledMatch = text.match(/^([①-⑳])\s+/);
        if (circledMatch) {
          const currentChar = circledMatch[1];
          const idx = CIRCLED_NUMBERS.indexOf(currentChar);
          if (idx !== -1 && idx < CIRCLED_NUMBERS.length - 1) {
            const nextChar = CIRCLED_NUMBERS[idx + 1];
            return this.editor
              .chain()
              .focus()
              .splitBlock()
              .insertContent(`${nextChar} `)
              .run();
          }
        }

        // 3. 호(號) 자동 증분 (1. -> 2.)
        const numberMatch = text.match(/^(\d+)\.\s+/);
        if (numberMatch) {
          const currentNum = parseInt(numberMatch[1], 10);
          const nextNum = currentNum + 1;
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .insertContent(`${nextNum}. `)
            .run();
        }

        return false;
      },
    };
  },
});