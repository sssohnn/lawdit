import { Extension, textInputRule } from '@tiptap/core';

export const CIRCLED_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
];

// 목차 규격 매핑
const LEVEL_CONFIG: Record<string, { prefix: string; indent: string }> = {
  '1': { prefix: 'Ⅰ. ', indent: '' },
  '2': { prefix: '1. ', indent: '\u00a0\u00a0' },
  '3': { prefix: '가. ', indent: '\u00a0\u00a0\u00a0\u00a0' },
  '4': { prefix: '(1) ', indent: '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0' },
  '5': { prefix: '① ', indent: '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0' },
};

function insertHeadingPrefix(editor: any, level: string): boolean {
  const cfg = LEVEL_CONFIG[level];
  if (!cfg) return false;

  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  const currentLine = $from.parent.textContent;

  // 빈 줄이거나 공백만 있는 줄이면 해당 줄 전체를 치환
  if (currentLine.replace(/[\s\u00a0]+/g, '').length === 0) {
    return editor
      .chain()
      .focus()
      .command(({ tr }: any) => {
        const start = $from.start();
        const end = $from.end();
        tr.replaceWith(start, end, state.schema.text(`${cfg.indent}${cfg.prefix}`));
        return true;
      })
      .run();
  }

  // 내용이 이미 있는 줄이면 커서 위치에 바로 주입
  return editor.chain().focus().insertContent(`${cfg.prefix}`).run();
}

export const LegalKeymapExtension = Extension.create({
  name: 'legalKeymap',
  priority: 1000,

  addInputRules() {
    return [
      textInputRule({ find: /\(\(1\)\)\s$/, replace: '① ' }),
      textInputRule({ find: /\(\(2\)\)\s$/, replace: '② ' }),
      textInputRule({ find: /\(\(3\)\)\s$/, replace: '③ ' }),
      textInputRule({ find: /\(\(4\)\)\s$/, replace: '④ ' }),
      textInputRule({ find: /\(\(5\)\)\s$/, replace: '⑤ ' }),
      textInputRule({ find: /\(\(6\)\)\s$/, replace: '⑥ ' }),
      textInputRule({ find: /\(\(7\)\)\s$/, replace: '⑦ ' }),
      textInputRule({ find: /\(\(8\)\)\s$/, replace: '⑧ ' }),
      textInputRule({ find: /\(\(9\)\)\s$/, replace: '⑨ ' }),
      textInputRule({ find: /\(\(10\)\)\s$/, replace: '⑩ ' }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // 목차 직행 단축키: 사파리/크롬 탭 이동 간섭 없는 Option(Alt) + Shift + 숫자 조합
      'Alt-Shift-1': () => insertHeadingPrefix(this.editor, '1'),
      'Alt-Shift-2': () => insertHeadingPrefix(this.editor, '2'),
      'Alt-Shift-3': () => insertHeadingPrefix(this.editor, '3'),
      'Alt-Shift-4': () => insertHeadingPrefix(this.editor, '4'),
      'Alt-Shift-5': () => insertHeadingPrefix(this.editor, '5'),

      // 원문자 다이렉트 단축키 (Alt/Option + 1~0)
      'Alt-1': () => this.editor.commands.insertContent('① '),
      'Alt-2': () => this.editor.commands.insertContent('② '),
      'Alt-3': () => this.editor.commands.insertContent('③ '),
      'Alt-4': () => this.editor.commands.insertContent('④ '),
      'Alt-5': () => this.editor.commands.insertContent('⑤ '),
      'Alt-6': () => this.editor.commands.insertContent('⑥ '),
      'Alt-7': () => this.editor.commands.insertContent('⑦ '),
      'Alt-8': () => this.editor.commands.insertContent('⑧ '),
      'Alt-9': () => this.editor.commands.insertContent('⑨ '),
      'Alt-0': () => this.editor.commands.insertContent('⑩ '),

      'Mod-Alt-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-Alt-q': () => this.editor.commands.toggleBlockquote(),

      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;

        const currentNode = $from.parent;
        if (currentNode.type.name !== 'paragraph') return false;

        const textBeforeCursor = currentNode.textBetween(0, $from.parentOffset, undefined, '\n');
        const textAfterCursor = currentNode.textBetween($from.parentOffset, currentNode.content.size, undefined, '\n');

        const lastNl = textBeforeCursor.lastIndexOf('\n');
        const lineBeforeCursor = lastNl !== -1 ? textBeforeCursor.slice(lastNl + 1) : textBeforeCursor;

        const nextNl = textAfterCursor.indexOf('\n');
        const lineAfterCursor = nextNl !== -1 ? textAfterCursor.slice(0, nextNl) : textAfterCursor;

        const fullCurrentLine = lineBeforeCursor + lineAfterCursor;
        const isAtLineEnd = lineAfterCursor.trim() === '';

        // 현재 줄의 들여쓰기 공백 분석
        const currentSpacesMatch = fullCurrentLine.match(/^([ \u00a0]*)/);
        const currentIndent = currentSpacesMatch ? currentSpacesMatch[1].replace(/ /g, '\u00a0') : '';
        const currentIndentLen = currentIndent.length;

        const isOnlyWhitespace = /^[ \u00a0]+$/.test(fullCurrentLine);
        const isOnlyNumberOrCircled = /^[ \u00a0]*(?:[①-⑳]|\d+\.|[가-하]\.|\(\d+\))[ \u00a0]*$/.test(fullCurrentLine);

        // 계층형 들여쓰기 후퇴 (Outdent Get-Back 엔진)
        if (isOnlyWhitespace || isOnlyNumberOrCircled) {
          if (currentIndentLen > 0) {
            const currentIndex = $from.index(0);
            let targetIndent = '';
            let found = false;

            // 내용이 있는 직전 상위 줄들의 들여쓰기를 역방향으로 동적 검색
            for (let i = currentIndex - 1; i >= 0; i--) {
              const prevText = state.doc.child(i).textContent;
              if (!prevText.trim()) continue;

              const prevMatch = prevText.match(/^([ \u00a0]*)/);
              const prevIndent = prevMatch ? prevMatch[1].replace(/ /g, '\u00a0') : '';

              if (prevIndent.length < currentIndentLen) {
                targetIndent = prevIndent;
                found = true;
                break;
              }
            }

            if (!found) {
              targetIndent = '';
            }

            return this.editor
              .chain()
              .focus()
              .command(({ tr }) => {
                const start = $from.start();
                const end = $from.end();
                tr.delete(start, end);
                if (targetIndent) {
                  tr.insertText(targetIndent, start);
                }
                return true;
              })
              .run();
          } else {
            if (isOnlyNumberOrCircled) {
              return this.editor
                .chain()
                .focus()
                .deleteRange({ from: $from.start(), to: $from.end() })
                .run();
            }
            return false;
          }
        }

        if (!isAtLineEnd) return false;

        // 1. 중목차(數字) 증분: 1. -> 2.
        const numberMatch = fullCurrentLine.match(/^([ \u00a0]*)(\d+)\.[ \u00a0]+(.*)$/);
        if (numberMatch) {
          const leadingSpaces = numberMatch[1].replace(/ /g, '\u00a0');
          const nextNum = parseInt(numberMatch[2], 10) + 1;
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr }) => {
              tr.insertText(`${leadingSpaces}${nextNum}. `);
              return true;
            })
            .run();
        }

        // 2. 소목차(한글) 증분: 가. -> 나.
        const hangulMatch = fullCurrentLine.match(/^([ \u00a0]*)([가-하])\.[ \u00a0]+(.*)$/);
        if (hangulMatch) {
          const leadingSpaces = hangulMatch[1].replace(/ /g, '\u00a0');
          const nextChar = String.fromCharCode(hangulMatch[2].charCodeAt(0) + 1);
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr }) => {
              tr.insertText(`${leadingSpaces}${nextChar}. `);
              return true;
            })
            .run();
        }

        // 3. 항(괄호 숫자) 증분: (1) -> (2)
        const parenMatch = fullCurrentLine.match(/^([ \u00a0]*)\((\d+)\)[ \u00a0]+(.*)$/);
        if (parenMatch) {
          const leadingSpaces = parenMatch[1].replace(/ /g, '\u00a0');
          const nextNum = parseInt(parenMatch[2], 10) + 1;
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr }) => {
              tr.insertText(`${leadingSpaces}(${nextNum}) `);
              return true;
            })
            .run();
        }

        // 4. 호(원문자) 증분: ① -> ②
        const circledMatch = fullCurrentLine.match(/^([ \u00a0]*)([①-⑳])[ \u00a0]+(.*)$/);
        if (circledMatch) {
          const leadingSpaces = circledMatch[1].replace(/ /g, '\u00a0');
          const currentChar = circledMatch[2];
          const idx = CIRCLED_NUMBERS.indexOf(currentChar);

          if (idx !== -1 && idx < CIRCLED_NUMBERS.length - 1) {
            const nextChar = CIRCLED_NUMBERS[idx + 1];
            return this.editor
              .chain()
              .focus()
              .splitBlock()
              .command(({ tr }) => {
                tr.insertText(`${leadingSpaces}${nextChar} `);
                return true;
              })
              .run();
          }
        }

        // 5. 일반 들여쓰기 공백 계승
        const spaceMatch = fullCurrentLine.match(/^([ \u00a0]+)/);
        if (spaceMatch) {
          const leadingSpaces = spaceMatch[1].replace(/ /g, '\u00a0');
          return this.editor
            .chain()
            .focus()
            .splitBlock()
            .command(({ tr }) => {
              tr.insertText(leadingSpaces);
              return true;
            })
            .run();
        }

        return false;
      },
    };
  },
});