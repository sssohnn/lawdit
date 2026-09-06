import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { FileText, Plus, Trash2, Calendar } from 'lucide-react';

import { LEGAL_DATA } from './data/legalSnippets';
import { copyForHWP } from './utils/clipboard';
import { matchKorean } from './utils/hangul';
import { LegalKeymapExtension } from './extensions/LegalKeymap';
import { useTimer } from './hooks/useTimer';
import { useDocumentStore } from './hooks/useDocumentStore';
import { StatusBar } from './components/StatusBar';
import { Header, THEMES, type WorkspaceTheme } from './components/Header';
import { SlashMenu, type SlashMenuItem } from './components/SlashMenu';

const ResizableImageComponent = ({ node, updateAttributes, selected }: any) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = imgRef.current ? imgRef.current.getBoundingClientRect().width : 300;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startX;
      const newWidth = Math.max(150, Math.round(startWidth + diffX));
      updateAttributes({ width: `${newWidth}px` });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const showControls = selected || isHovered;

  return (
    <NodeViewWrapper
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '8px 0' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position: 'relative',
        display: 'inline-block',
        border: selected ? '2px solid #2563eb' : '2px solid transparent',
        borderRadius: '4px',
        lineHeight: 0,
      }}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          draggable={false}
          style={{
            width: node.attrs.width || '100%',
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '2px',
            border: '1px solid #cbd5e1',
          }}
        />

        {showControls && (
          <>
            <div
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                display: 'flex',
                gap: '3px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: '2px 4px',
                borderRadius: '4px',
                zIndex: 10,
              }}
            >
              {['25%', '50%', '75%', '100%'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateAttributes({ width: w })}
                  style={{
                    padding: '2px 5px',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: node.attrs.width === w ? '#ffffff' : '#94a3b8',
                    backgroundColor: node.attrs.width === w ? '#2563eb' : 'transparent',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>

            <div
              onMouseDown={handleMouseDown}
              style={{
                position: 'absolute',
                right: '-5px',
                bottom: '-5px',
                width: '12px',
                height: '12px',
                backgroundColor: '#2563eb',
                border: '2px solid #ffffff',
                borderRadius: '2px',
                cursor: 'nwse-resize',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                zIndex: 10,
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => ({
          width: attributes.width,
          style: `width: ${attributes.width}; max-width: 100%;`,
        }),
        parseHTML: (element) => element.getAttribute('width') || element.style.width || '100%',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ charsWithSpaces: 0, charsWithoutSpaces: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  // 다중 문서 스토어 훅 연동
  const {
    documents,
    activeDoc,
    activeDocId,
    setActiveDocId,
    updateCurrentDoc,
    createNewDoc,
    removeDoc,
  } = useDocumentStore();

  const [currentTheme, setCurrentTheme] = useState<WorkspaceTheme>(() => {
    const saved = localStorage.getItem('lawdit-theme');
    return THEMES.find((t) => t.id === saved) || THEMES[0];
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const {
    selectedDuration,
    timeLeft,
    isTimerRunning,
    isTimerPickerOpen,
    setIsTimerPickerOpen,
    formattedTime,
    handleTimerReset,
    toggleTimer,
    presets,
  } = useTimer(3600);

  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    query: string;
    range: { from: number; to: number };
    position: { top: number; left: number };
    selectedIndex: number;
    items: SlashMenuItem[];
  }>({
    isOpen: false,
    query: '',
    range: { from: 0, to: 0 },
    position: { top: 0, left: 0 },
    selectedIndex: 0,
    items: [],
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: false,
        bulletList: false,
        listItem: false,
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ResizableImage.configure({ allowBase64: true }),
      LegalKeymapExtension,
    ],
    editorProps: {
      handleKeyDown: (view, event) => {
        if (slashMenu.isOpen) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSlashMenu((prev) => ({
              ...prev,
              selectedIndex: (prev.selectedIndex + 1) % Math.max(1, prev.items.length),
            }));
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSlashMenu((prev) => ({
              ...prev,
              selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % Math.max(1, prev.items.length),
            }));
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (slashMenu.items.length > 0) {
              insertSnippet(slashMenu.items[slashMenu.selectedIndex]);
            }
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setSlashMenu((prev) => ({ ...prev, isOpen: false }));
            return true;
          }
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (event.shiftKey) {
            const { state, dispatch } = view;
            const { $from } = state.selection;
            const text = $from.parent.textContent;
            const match = text.match(/^([ \u00a0]{1,2})/);
            if (match) {
              dispatch(state.tr.delete($from.start(), $from.start() + match[1].length));
            }
          } else {
            view.dispatch(view.state.tr.insertText('\u00a0\u00a0'));
          }
          return true;
        }
        return false;
      },
    },
    content: activeDoc.content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const html = editor.getHTML();

      updateCurrentDoc(html, text);

      setStats({
        charsWithSpaces: text.length,
        charsWithoutSpaces: text.replace(/\s+/g, '').length,
      });
    },
  });

  // 활성 문서(activeDocId)가 변경될 때 에디터 내용 동기화
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== activeDoc.content) {
      editor.commands.setContent(activeDoc.content || '<p></p>');
    }
  }, [activeDocId, editor]);

  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    setStats({
      charsWithSpaces: text.length,
      charsWithoutSpaces: text.replace(/\s+/g, '').length,
    });

    const selectionUpdateHandler = () => {
      const { selection } = editor.state;
      const { $from, empty } = selection;
      if (!empty) {
        setSlashMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
        return;
      }

      const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
      const slashMatch = textBefore.match(/\/([가-힣a-zA-Z0-9ㄱ-ㅎ]*)$/);

      if (slashMatch) {
        const query = slashMatch[1];
        const matchStart = $from.pos - slashMatch[0].length;
        const matchEnd = $from.pos;

        const matched = LEGAL_DATA.filter((item: any) =>
          matchKorean(item.title, query) ||
          (item.reference ? matchKorean(item.reference, query) : false) ||
          (item.triggers && item.triggers.some((t: string) => matchKorean(t, query)))
        );

        const coords = editor.view.coordsAtPos(matchStart);

        setSlashMenu({
          isOpen: true,
          query,
          range: { from: matchStart, to: matchEnd },
          position: { top: coords.bottom + window.scrollY + 6, left: coords.left + window.scrollX },
          selectedIndex: 0,
          items: matched,
        });
      } else {
        setSlashMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      }
    };

    editor.on('selectionUpdate', selectionUpdateHandler);
    return () => {
      editor.off('selectionUpdate', selectionUpdateHandler);
    };
  }, [editor]);

  const handleThemeChange = (theme: WorkspaceTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('lawdit-theme', theme.id);
    setIsThemePickerOpen(false);
  };

  const insertSnippet = (snippet: SlashMenuItem) => {
    if (!editor) return;

    const { state } = editor;
    const $pos = state.doc.resolve(slashMenu.range.from);
    const currentText = $pos.parent.textContent;
    const slashIdx = currentText.lastIndexOf('/');
    const textBeforeSlash = slashIdx !== -1 ? currentText.slice(0, slashIdx) : '';

    let indent = '';
    const isStandaloneLine = textBeforeSlash.trim() === '';

    if (isStandaloneLine) {
      if (textBeforeSlash.length > 0) {
        indent = textBeforeSlash.replace(/ /g, '\u00a0');
      } else {
        const prevNodePos = $pos.before();
        if (prevNodePos > 0) {
          const $prev = state.doc.resolve(prevNodePos - 1);
          const prevText = $prev.parent.textContent;
          const prevMatch = prevText.match(/^([ \u00a0]*)/);
          indent = (prevMatch ? prevMatch[1].replace(/ /g, '\u00a0') : '') + '\u00a0\u00a0';
        } else {
          indent = '\u00a0\u00a0';
        }
      }

      let html = '';
      if (snippet.isInline) {
        html = `<p>${indent}<strong>${snippet.snippetTitle}</strong> ${snippet.items.join('&nbsp;&nbsp;')}</p>`;
      } else {
        html = `<p>${indent}<strong>${snippet.snippetTitle}</strong></p>` +
          snippet.items.map((it: string) => `<p>${indent}${it}</p>`).join('');
      }

      editor
        .chain()
        .focus()
        .deleteRange({ from: $pos.start(), to: $pos.end() })
        .insertContent(html)
        .run();
    } else {
      const leadingMatch = textBeforeSlash.match(/^([ \u00a0]*)/);
      indent = (leadingMatch ? leadingMatch[1].replace(/ /g, '\u00a0') : '') + '\u00a0\u00a0';

      let html = '';
      if (snippet.isInline) {
        html = `<p>${indent}<strong>${snippet.snippetTitle}</strong> ${snippet.items.join('&nbsp;&nbsp;')}</p>`;
      } else {
        html = `<p>${indent}<strong>${snippet.snippetTitle}</strong></p>` +
          snippet.items.map((it: string) => `<p>${indent}${it}</p>`).join('');
      }

      editor
        .chain()
        .focus()
        .deleteRange(slashMenu.range)
        .insertContent(html)
        .run();
    }

    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  };

  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCopy = async () => {
    const success = await copyForHWP(editor);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  return (
    <div style={{
      backgroundColor: currentTheme.bgColor,
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        button:focus { outline: none !important; }
        .ProseMirror:focus { outline: none !important; }

        .ProseMirror {
          text-align: left !important;
          white-space: pre-wrap !important;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "KoPubBatang", serif !important;
          color: #0f172a;
          font-size: 15px;
          letter-spacing: -0.015em;
        }

        .ProseMirror * { text-align: left !important; }

        .ProseMirror em,
        .ProseMirror i {
          font-style: oblique 12deg !important;
          font-synthesis: style !important;
          -webkit-font-synthesis: style !important;
        }

        .ProseMirror p {
          margin: 2px 0 !important;
          line-height: 1.62 !important;
          white-space: pre-wrap !important;
          padding: 0 !important;
        }

        .ProseMirror h2 {
          font-size: 1.18rem !important;
          font-weight: 800 !important;
          margin: 22px 0 8px 0 !important;
          color: #0f172a !important;
          letter-spacing: -0.02em;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #2563eb !important;
          background-color: #f8fafc !important;
          padding: 8px 14px !important;
          margin: 10px 0 !important;
          border-radius: 0 6px 6px 0 !important;
          color: #334155 !important;
          font-style: normal !important;
        }

        .ProseMirror blockquote p { margin: 0 !important; }

        .ProseMirror img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 10px 0 !important;
          border-radius: 4px !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* 상단 통합 헤더 */}
      <Header
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
        currentTheme={currentTheme}
        isThemePickerOpen={isThemePickerOpen}
        setIsThemePickerOpen={setIsThemePickerOpen}
        onThemeChange={handleThemeChange}
        timeLeft={timeLeft}
        isTimerRunning={isTimerRunning}
        isTimerPickerOpen={isTimerPickerOpen}
        setIsTimerPickerOpen={setIsTimerPickerOpen}
        formattedTime={formattedTime}
        selectedDuration={selectedDuration}
        presets={presets}
        onTimerToggle={toggleTimer}
        onTimerReset={handleTimerReset}
        onCopy={handleCopy}
        copyFeedback={copyFeedback}
        onNewDoc={createNewDoc}
      />

      {/* 슬래시 팝업 */}
      <SlashMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        items={slashMenu.items}
        selectedIndex={slashMenu.selectedIndex}
        onSelect={insertSnippet}
      />

      {/* 메인 A4 에디터 캔버스 */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 16px 40px 16px',
      }}>
        {/* A4 용지 */}
        <div style={{
          width: '816px',
          minHeight: '1154px',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(226, 232, 240, 0.9)',
          borderRadius: '4px',
          padding: '80px 88px',
          transition: 'box-shadow 0.2s ease',
        }}>
          <EditorContent editor={editor} />
        </div>

        {/* 썸네일 서랍 (A4 용지 바로 밑에 배치) */}
        <section style={{
          width: '816px',
          marginTop: '32px',
          marginBottom: '60px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '0 4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: currentTheme.id === 'slate' || currentTheme.id === 'deepnavy' ? '#cbd5e1' : '#334155' }}>
                보관 중인 서면 목록 ({documents.length})
              </span>
            </div>
            <button
              type="button"
              onClick={createNewDoc}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              }}
            >
              <Plus size={13} />
              새 서면 추가
            </button>
          </div>

          {/* 썸네일 카드 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))',
            gap: '14px',
          }}>
            {documents.map((doc) => {
              const isActive = doc.id === activeDocId;
              const snippetText = doc.content.replace(/<[^>]*>/g, '').trim().slice(0, 75);

              return (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  style={{
                    position: 'relative',
                    height: '190px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    border: isActive ? '2px solid #2563eb' : '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: isActive ? '0 10px 20px -3px rgba(37, 99, 235, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                        <FileText size={14} color={isActive ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: isActive ? '#1d4ed8' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {doc.title}
                        </span>
                      </div>
                      {documents.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`'${doc.title}' 서면을 삭제하시겠습니까?`)) {
                              removeDoc(doc.id);
                            }
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '2px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* 미니 문서 텍스트 썸네일 프리뷰 */}
                    <div style={{
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#64748b',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      padding: '8px',
                      height: '95px',
                      overflow: 'hidden',
                      wordBreak: 'break-all',
                      border: '1px solid #f1f5f9',
                    }}>
                      {snippetText || '(내용 없음)'}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    color: '#94a3b8',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '6px',
                  }}>
                    <Calendar size={10} />
                    {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* 하단 상태바 */}
      <StatusBar
        charsWithSpaces={stats.charsWithSpaces}
        charsWithoutSpaces={stats.charsWithoutSpaces}
      />
    </div>
  );
}