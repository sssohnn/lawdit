import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

import { LEGAL_DATA } from './data/legalSnippets';
import { copyForHWP } from './utils/clipboard';
import { matchKorean } from './utils/hangul';
import { LegalFormatExtension, adaptSnippetHierarchy } from './extensions/LegalKeymap';
import { ResizableImage } from './components/ResizableImage';
import { useTimer } from './hooks/useTimer';
import { useDocumentStore } from './hooks/useDocumentStore';
import { StatusBar } from './components/StatusBar';
import { Header, THEMES, type WorkspaceTheme } from './components/Header';
import { SlashMenu, type SlashMenuItem } from './components/SlashMenu';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [stats, setStats] = useState({ charsWithSpaces: 0, charsWithoutSpaces: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [docContentHeight, setDocContentHeight] = useState(816);

  const {
    documents,
    activeDoc,
    activeDocId,
    setActiveDocId,
    updateCurrentDoc,
    createNewDoc,
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

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 50 });

  const pageWidth = orientation === 'portrait' ? 816 : 1152;
  const pageUnitHeight = orientation === 'portrait' ? 1152 : 816;

  const handleResetView = useCallback(() => {
    const centeredX = Math.round((window.innerWidth - pageWidth) / 2);
    setPan({ x: centeredX, y: 48 });
  }, [pageWidth]);

  useEffect(() => {
    handleResetView();
  }, [handleResetView]);

  // Safari WebKit W3C 규격 준수: root 레벨 @page 규칙 주입 (!important 전면 배제)
  useEffect(() => {
    let styleEl = document.getElementById('lawdit-safari-print-orientation') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'lawdit-safari-print-orientation';
      document.head.appendChild(styleEl);
    }
    const isLandscape = orientation === 'landscape';
    styleEl.textContent = `
      @page {
        size: ${isLandscape ? 'landscape' : 'portrait'};
        margin: 15mm;
      }
    `;
  }, [orientation]);

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
      LegalFormatExtension,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ResizableImage.configure({ allowBase64: true }),
    ],
    content: activeDoc.content,
    onUpdate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText();
      const html = currentEditor.getHTML();
      updateCurrentDoc(html, text);

      setStats({
        charsWithSpaces: text.length,
        charsWithoutSpaces: text.replace(/\s+/g, '').length,
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== activeDoc.content) {
      editor.commands.setContent(activeDoc.content || '<p></p>');
    }
  }, [activeDocId, editor]);

  useEffect(() => {
    if (!editorContentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDocContentHeight(Math.max(entry.contentRect.height + 48, pageUnitHeight));
      }
    });
    observer.observe(editorContentRef.current);
    return () => observer.disconnect();
  }, [pageUnitHeight]);

  useEffect(() => {
    if (!editor) return;

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

        const matched = LEGAL_DATA.filter((item) =>
          matchKorean(item.title, query) ||
          (item.reference ? matchKorean(item.reference, query) : false) ||
          (item.triggers && item.triggers.some((t: string) => matchKorean(t, query)))
        );

        const coords = editor.view.coordsAtPos(matchStart);
        const menuHeight = 320;
        const spaceBelow = window.innerHeight - coords.bottom;

        const shouldFlipUp = spaceBelow < menuHeight + 20;
        const calculatedTop = shouldFlipUp
          ? Math.max(10, coords.top - menuHeight - 8)
          : coords.bottom + 6;

        setSlashMenu({
          isOpen: true,
          query,
          range: { from: matchStart, to: matchEnd },
          position: { top: calculatedTop, left: Math.min(coords.left, window.innerWidth - 400) },
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

  // 스니펫 주입 (텍스트 공백 완전 배제, 블록 indent로만 주입)
  const insertSnippet = useCallback((snippet: SlashMenuItem) => {
    if (!editor) return;

    const { state } = editor;
    const $pos = state.doc.resolve(slashMenu.range.from);

    const blockStart = $pos.start();
    const blockEnd = $pos.end();

    const currentIndex = $pos.index(0);
    let prevLineText = '';
    let prevIndent = 0;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const node = state.doc.child(i);
      const text = node.textContent;
      if (text.trim().length > 0) {
        prevLineText = text;
        prevIndent = node.attrs.indent || 0;
        break;
      }
    }

    const { titleHtml, itemsHtml } = adaptSnippetHierarchy(
      snippet.snippetTitle,
      snippet.items,
      prevLineText,
      prevIndent
    );

    const fullHtml = titleHtml + itemsHtml.join('');

    editor
      .chain()
      .focus()
      .deleteRange({ from: blockStart, to: blockEnd })
      .insertContent(fullHtml)
      .run();

    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  }, [editor, slashMenu.range]);

  // 윈도우 키보드 캡처링 (슬래시 메뉴 오픈 시 커서 튐 차단)
  useEffect(() => {
    if (!slashMenu.isOpen) return;

    const handleGlobalCaptureKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % Math.max(1, prev.items.length),
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % Math.max(1, prev.items.length),
        }));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (slashMenu.items.length > 0) {
          insertSnippet(slashMenu.items[slashMenu.selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalCaptureKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalCaptureKeyDown, true);
    };
  }, [slashMenu.isOpen, slashMenu.items, slashMenu.selectedIndex, insertSnippet]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && !((e.target as HTMLElement).classList.contains('ProseMirror'))) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    const isTargetCanvasBg = e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('freeform-pan-target');
    if (isTargetCanvasBg || isSpacePressed || e.button === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialPanRef.current = { ...pan };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    setPan((prev) => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCopy = async () => {
    if (!editor) return;
    const success = await copyForHWP(editor);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  // Safari 인쇄 다이얼로그 호출 전 동기식 Reflow 강제 실행
  const handleExportPdf = () => {
    const isLandscape = orientation === 'landscape';
    let styleEl = document.getElementById('lawdit-safari-print-orientation') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'lawdit-safari-print-orientation';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @page {
        size: ${isLandscape ? 'landscape' : 'portrait'};
        margin: 15mm;
      }
    `;

    // Safari 레이아웃 엔진 강제 동기화 (Reflow)
    void document.body.offsetHeight;

    setTimeout(() => {
      window.print();
    }, 50);
  };

  const pageCount = Math.max(1, Math.ceil(docContentHeight / pageUnitHeight));
  const totalPageHeight = pageCount * pageUnitHeight;

  if (!editor) return null;

  return (
    <div
      className="lawdit-app-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: currentTheme.canvasBg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .ProseMirror:focus { outline: none !important; }
        .ProseMirror {
          min-height: 100%;
          text-align: left !important;
          white-space: pre-wrap !important;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "KoPubBatang", serif !important;
          color: #0f172a;
          font-size: 15px;
          letter-spacing: -0.015em;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* 문단 블록 margin-left 제어로 긴 문장 줄바꿈 시 둘째 줄 시작선 고정 */
        .ProseMirror p {
          margin-top: 2px !important;
          margin-bottom: 2px !important;
          margin-right: 0 !important;
          line-height: 1.62 !important;
          word-break: break-all !important;
        }

        .ProseMirror p[data-indent="0"], .ProseMirror p.legal-indent-0 { margin-left: 0px !important; }
        .ProseMirror p[data-indent="1"], .ProseMirror p.legal-indent-1 { margin-left: 24px !important; }
        .ProseMirror p[data-indent="2"], .ProseMirror p.legal-indent-2 { margin-left: 48px !important; }
        .ProseMirror p[data-indent="3"], .ProseMirror p.legal-indent-3 { margin-left: 72px !important; }
        .ProseMirror p[data-indent="4"], .ProseMirror p.legal-indent-4 { margin-left: 96px !important; }
        .ProseMirror p[data-indent="5"], .ProseMirror p.legal-indent-5 { margin-left: 120px !important; }
        .ProseMirror p[data-indent="6"], .ProseMirror p.legal-indent-6 { margin-left: 144px !important; }
        .ProseMirror p[data-indent="7"], .ProseMirror p.legal-indent-7 { margin-left: 168px !important; }
        .ProseMirror p[data-indent="8"], .ProseMirror p.legal-indent-8 { margin-left: 192px !important; }

        .ProseMirror h2 {
          font-size: 1.15rem !important;
          font-weight: 800 !important;
          margin: 18px 0 6px 0 !important;
          color: #0f172a !important;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #2563eb !important;
          background-color: rgba(241, 245, 249, 0.7) !important;
          padding: 6px 12px !important;
          margin: 8px 0 !important;
          border-radius: 0 4px 4px 0 !important;
        }

        /* 인쇄 전용 완전 격리 스타일: 오직 활성 서면 1종만 렌더링 */
        @media print {
          /* 화면 내 모든 부모 및 타 서면 숨김 */
          body * {
            visibility: hidden;
          }

          /* 현재 작업 중인 단일 서면 본체만 출력 노출 */
          #lawdit-active-document,
          #lawdit-active-document * {
            visibility: visible;
          }

          #lawdit-active-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            background-image: none !important;
            transform: none !important;
          }

          header,
          footer,
          .screen-only,
          .lawdit-tag,
          .lawdit-page-divider {
            display: none !important;
          }

          .ProseMirror {
            font-size: 11pt !important;
            line-height: 1.65 !important;
            color: #000000 !important;
          }

          .ProseMirror p {
            page-break-inside: avoid;
            margin-top: 1.5pt !important;
            margin-bottom: 1.5pt !important;
          }

          /* 인쇄 환경에서의 pt 단위 환산 */
          .ProseMirror p[data-indent="0"], .ProseMirror p.legal-indent-0 { margin-left: 0pt !important; }
          .ProseMirror p[data-indent="1"], .ProseMirror p.legal-indent-1 { margin-left: 18pt !important; }
          .ProseMirror p[data-indent="2"], .ProseMirror p.legal-indent-2 { margin-left: 36pt !important; }
          .ProseMirror p[data-indent="3"], .ProseMirror p.legal-indent-3 { margin-left: 54pt !important; }
          .ProseMirror p[data-indent="4"], .ProseMirror p.legal-indent-4 { margin-left: 72pt !important; }
          .ProseMirror p[data-indent="5"], .ProseMirror p.legal-indent-5 { margin-left: 90pt !important; }
          .ProseMirror p[data-indent="6"], .ProseMirror p.legal-indent-6 { margin-left: 108pt !important; }
          .ProseMirror p[data-indent="7"], .ProseMirror p.legal-indent-7 { margin-left: 126pt !important; }
          .ProseMirror p[data-indent="8"], .ProseMirror p.legal-indent-8 { margin-left: 144pt !important; }
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div className="screen-only">
        <Header
          editor={editor}
          onImageClick={() => fileInputRef.current?.click()}
          currentTheme={currentTheme}
          isThemePickerOpen={isThemePickerOpen}
          setIsThemePickerOpen={setIsThemePickerOpen}
          onThemeChange={(t) => {
            setCurrentTheme(t);
            localStorage.setItem('lawdit-theme', t.id);
            setIsThemePickerOpen(false);
          }}
          orientation={orientation}
          onOrientationChange={setOrientation}
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={setActiveDocId}
          onNewDoc={createNewDoc}
          onResetView={handleResetView}
          onExportPdf={handleExportPdf}
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
        />
      </div>

      <div className="screen-only">
        <SlashMenu
          isOpen={slashMenu.isOpen}
          position={slashMenu.position}
          items={slashMenu.items}
          selectedIndex={slashMenu.selectedIndex}
          onSelect={insertSnippet}
        />
      </div>

      {/* 360도 무한 모눈 캔버스 */}
      <main
        ref={canvasRef}
        onMouseDown={handleMouseDownCanvas}
        onWheel={handleWheel}
        className="freeform-pan-target"
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          userSelect: isDragging ? 'none' : 'auto',
          cursor: isDragging ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
          backgroundColor: currentTheme.canvasBg,
          backgroundImage: `linear-gradient(to right, ${currentTheme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.gridLine} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          className="lawdit-pan-plane"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
            willChange: 'transform',
          }}
        >
          {/* 현재 작업 중인 단일 서면 본체 (id="lawdit-active-document"로 인쇄 격리) */}
          <div
            id="lawdit-active-document"
            style={{
              position: 'relative',
              width: `${pageWidth}px`,
              minHeight: `${totalPageHeight}px`,
              backgroundColor: currentTheme.docBg,
              backgroundImage: `linear-gradient(to right, ${currentTheme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.gridLine} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0',
              border: '1.5px dashed #2563eb',
              borderRadius: '2px',
              boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(37, 99, 235, 0.2)',
              padding: '24px 24px',
              transition: 'min-height 0.1s ease',
            }}
          >
            <div
              className="lawdit-tag screen-only"
              style={{
                position: 'absolute',
                top: '-11px',
                right: '16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '3px',
                letterSpacing: '0.05em',
                pointerEvents: 'none',
                boxShadow: '0 2px 5px rgba(37, 99, 235, 0.3)',
              }}
            >
              PDF EXPORT ZONE ({pageWidth} × {pageUnitHeight}px · {pageCount}P)
            </div>

            {/* A4 페이지 분할 절취선 */}
            {Array.from({ length: pageCount - 1 }).map((_, i) => {
              const cutTop = (i + 1) * pageUnitHeight;
              return (
                <div
                  key={i}
                  className="lawdit-page-divider screen-only"
                  style={{
                    position: 'absolute',
                    top: `${cutTop}px`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    borderTop: '1.5px dashed rgba(37, 99, 235, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    zIndex: 20,
                    pointerEvents: 'none',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      color: '#ffffff',
                      backgroundColor: '#2563eb',
                      padding: '1px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    P.{i + 2}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      color: '#2563eb',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    ✂ A4 PAGE {i + 1} / {i + 2} 절취선
                  </span>
                </div>
              );
            })}

            <div ref={editorContentRef}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </main>

      <div className="screen-only">
        <StatusBar
          charsWithSpaces={stats.charsWithSpaces}
          charsWithoutSpaces={stats.charsWithoutSpaces}
        />
      </div>
    </div>
  );
}