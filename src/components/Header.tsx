import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading2,
  Quote,
  Indent,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Scale,
  Copy,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Palette,
  Check,
  Download,
  Printer,
  HelpCircle,
  X,
  FilePlus2,
  AlertCircle,
} from 'lucide-react';

export interface WorkspaceTheme {
  id: string;
  name: string;
  bgColor: string;
  accentDot: string;
}

export interface HeaderTimerPreset {
  label: string;
  val: number;
}

export const THEMES: WorkspaceTheme[] = [
  { id: 'slate', name: '슬레이트 쿨', bgColor: '#0f172a', accentDot: '#38bdf8' },
  { id: 'neutral', name: '모던 그레이', bgColor: '#f1f5f9', accentDot: '#64748b' },
  { id: 'oat', name: '웜 오트밀', bgColor: '#f7f5f0', accentDot: '#c2a67e' },
  { id: 'deepnavy', name: '다크 인디고', bgColor: '#111827', accentDot: '#818cf8' },
];

interface HeaderProps {
  editor: Editor | null;
  onImageClick: () => void;
  currentTheme: WorkspaceTheme;
  isThemePickerOpen: boolean;
  setIsThemePickerOpen: (open: boolean) => void;
  onThemeChange: (theme: WorkspaceTheme) => void;
  timeLeft: number;
  isTimerRunning: boolean;
  isTimerPickerOpen: boolean;
  setIsTimerPickerOpen: (open: boolean) => void;
  formattedTime: string;
  selectedDuration: number;
  presets: HeaderTimerPreset[];
  onTimerToggle: () => void;
  onTimerReset: (val?: number) => void;
  onCopy: () => void;
  copyFeedback: boolean;
  onNewDoc: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  editor,
  onImageClick,
  currentTheme,
  isThemePickerOpen,
  setIsThemePickerOpen,
  onThemeChange,
  timeLeft,
  isTimerRunning,
  isTimerPickerOpen,
  setIsTimerPickerOpen,
  formattedTime,
  selectedDuration,
  presets,
  onTimerToggle,
  onTimerReset,
  onCopy,
  copyFeedback,
  onNewDoc,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isNewDocConfirmOpen, setIsNewDocConfirmOpen] = useState(false);

  if (!editor) return null;

  const toolBtnStyle = (isActive: boolean = false, isDisabled: boolean = false) => ({
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: isActive ? '#e2e8f0' : 'transparent',
    color: isActive ? '#0f172a' : '#64748b',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.35 : 1,
    transition: 'all 0.12s ease',
  });

  const handleDownloadTxt = () => {
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `법률서면_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  const confirmNewDoc = () => {
    onNewDoc();
    setIsNewDocConfirmOpen(false);
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* 좌측: 로고 및 새 서면 작성 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.15)',
              }}
            >
              <Scale size={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.04em', color: '#0f172a' }}>
                Lawdit
              </span>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#2563eb', letterSpacing: '0.05em' }}>
                PRO
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

          <button
            type="button"
            onClick={() => setIsNewDocConfirmOpen(true)}
            title="새 서면 작성 (내용 초기화)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '5px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FilePlus2 size={13} color="#2563eb" />
            새 서면
          </button>
        </div>

        {/* 중앙: 캡슐형 툴바 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '7px',
            padding: '2px 3px',
            gap: '1px',
          }}
        >
          <button type="button" title="굵게 (Cmd+B)" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} style={toolBtnStyle(editor.isActive('bold'))}><Bold size={13} /></button>
          <button type="button" title="기울임 (Cmd+I)" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} style={toolBtnStyle(editor.isActive('italic'))}><Italic size={13} /></button>
          <button type="button" title="밑줄 (Cmd+U)" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} style={toolBtnStyle(editor.isActive('underline'))}><UnderlineIcon size={13} /></button>
          <button type="button" title="취소선" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()} style={toolBtnStyle(editor.isActive('strike'))}><Strikethrough size={13} /></button>
          <button type="button" title="형광펜" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} style={toolBtnStyle(editor.isActive('highlight'))}><Highlighter size={13} /></button>

          <button
            type="button"
            title="증거 번호 (빨강)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor.isActive('textStyle', { color: '#dc2626' })) {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().setColor('#dc2626').run();
              }
            }}
            style={{ ...toolBtnStyle(editor.isActive('textStyle', { color: '#dc2626' })), color: '#dc2626', fontWeight: '800', fontSize: '12px' }}
          >A</button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0', margin: '0 3px' }} />

          <button type="button" title="조문 제목" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={toolBtnStyle(editor.isActive('heading', { level: 2 }))}><Heading2 size={14} /></button>
          <button type="button" title="판례 인용구" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolBtnStyle(editor.isActive('blockquote'))}><Quote size={13} /></button>
          <button type="button" title="들여쓰기 (Tab)" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertContent('\u00a0\u00a0').run()} style={toolBtnStyle(false)}><Indent size={13} /></button>
          <button type="button" title="사진 첨부" onMouseDown={(e) => e.preventDefault()} onClick={onImageClick} style={toolBtnStyle(false)}><ImageIcon size={13} /></button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0', margin: '0 3px' }} />

          <button type="button" title="실행 취소" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} style={toolBtnStyle(false, !editor.can().undo())}><Undo2 size={13} /></button>
          <button type="button" title="다시 실행" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} style={toolBtnStyle(false, !editor.can().redo())}><Redo2 size={13} /></button>
        </div>

        {/* 우측: 도구, 타이머, 내보내기, 전체 복사 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          {/* 가이드 */}
          <button
            type="button"
            title="단축키 가이드"
            onClick={() => setIsHelpOpen(true)}
            style={{
              ...toolBtnStyle(isHelpOpen),
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <HelpCircle size={14} />
          </button>

          {/* 테마 피커 */}
          <button
            type="button"
            title="캔버스 배경 테마"
            onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
            style={{
              ...toolBtnStyle(isThemePickerOpen),
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              gap: '4px',
              padding: '0 7px',
              width: 'auto',
            }}
          >
            <Palette size={13} />
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: currentTheme.accentDot }} />
          </button>

          {isThemePickerOpen && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: '240px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 110,
              minWidth: '130px',
            }}>
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => onThemeChange(th)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: currentTheme.id === th.id ? '#f1f5f9' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: currentTheme.id === th.id ? '600' : '400',
                    color: '#1e293b',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: th.accentDot }} />
                  {th.name}
                </button>
              ))}
            </div>
          )}

          {/* 타이머 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: timeLeft < 300 && isTimerRunning ? '#fef2f2' : '#ffffff',
            padding: '1px 3px',
            gap: '1px',
          }}>
            <button
              type="button"
              onClick={() => setIsTimerPickerOpen(!isTimerPickerOpen)}
              title="시험 시간 선택"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '2px 5px',
                fontSize: '12px',
                fontWeight: '700',
                color: timeLeft < 300 && isTimerRunning ? '#dc2626' : '#1e293b',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Timer size={12} />
              {formattedTime}
            </button>

            <button
              type="button"
              onClick={onTimerToggle}
              title={isTimerRunning ? '일시정지' : '시작'}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                color: isTimerRunning ? '#dc2626' : '#2563eb',
              }}
            >
              {isTimerRunning ? <Pause size={11} /> : <Play size={11} />}
            </button>

            <button
              type="button"
              onClick={() => onTimerReset()}
              title="리셋"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                color: '#94a3b8',
              }}
            >
              <RotateCcw size={11} />
            </button>
          </div>

          {isTimerPickerOpen && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: '140px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 110,
              minWidth: '130px',
            }}>
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => onTimerReset(p.val)}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: selectedDuration === p.val ? '#f1f5f9' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: selectedDuration === p.val ? '600' : '400',
                    color: '#1e293b',
                    textAlign: 'left',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* 내보내기 */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              title="파일 내보내기"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              style={{
                ...toolBtnStyle(isExportMenuOpen),
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                width: '30px',
                height: '30px',
              }}
            >
              <Download size={13} />
            </button>

            {isExportMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '36px',
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 110,
                minWidth: '150px',
              }}>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  style={{
                    padding: '7px 10px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <Download size={12} color="#2563eb" />
                  텍스트 저장 (.txt)
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    padding: '7px 10px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <Printer size={12} color="#059669" />
                  인쇄 / PDF 저장
                </button>
              </div>
            )}
          </div>

          {/* 전체 복사 */}
          <button
            type="button"
            title="문서 전체 복사 (HWP 바탕글 서식 상속)"
            onClick={onCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 11px',
              backgroundColor: copyFeedback ? '#15803d' : '#0f172a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            {copyFeedback ? <Check size={12} /> : <Copy size={12} />}
            {copyFeedback ? '복사 완료' : '전체 복사'}
          </button>
        </div>
      </header>

      {/* 새 문서 확인 모달 */}
      {isNewDocConfirmOpen && (
        <div
          onClick={() => setIsNewDocConfirmOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              width: '380px',
              padding: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>새 서면을 작성하시겠습니까?</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>작성 중이던 본문 내용이 완전히 초기화됩니다.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsNewDocConfirmOpen(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmNewDoc}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                비우고 새로 작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 가이드 모달 */}
      {isHelpOpen && (
        <div
          onClick={() => setIsHelpOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '460px',
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={18} color="#2563eb" />
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Lawdit 실무 가이드</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#334155' }}>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>📌 계층형 목차 단축키 (Mac)</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px', color: '#475569' }}>
                  <span><code>⌥ ⇧ 1</code></span><span>대목차 ( Ⅰ. )</span>
                  <span><code>⌥ ⇧ 2</code></span><span>중목차 ( 1. ) + 2칸 들여쓰기</span>
                  <span><code>⌥ ⇧ 3</code></span><span>소목차 ( 가. ) + 4칸 들여쓰기</span>
                  <span><code>⌥ ⇧ 4</code></span><span>항 ( (1) ) + 6칸 들여쓰기</span>
                  <span><code>⌥ ⇧ 5</code></span><span>호 ( ① ) + 8칸 들여쓰기</span>
                </div>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>📌 원문자 및 인용 단축키</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px', color: '#475569' }}>
                  <span><code>⌥ 1 ~ 0</code></span><span>원문자 ( ① ~ ⑩ ) 즉시 주입</span>
                  <span><code>((1)) + 스페이스</code></span><span>원문자 자동 치환</span>
                  <span><code>⌥ ⌘ 2</code></span><span>청구원인 표제 (H2)</span>
                  <span><code>⌥ ⌘ Q</code></span><span>판례 인용 블록</span>
                </div>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>📌 슬래시(/) 자동 서식 및 요건사실</strong>
                <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>
                  빈 줄에서 <code>/</code>를 입력하면 소장, 답변서, 준비서면 템플릿(<code>/ㅅㅈ</code>, <code>/ㄷㅂㅅ</code>) 및 21대 민사 요건사실(<code>/ㅅㅇㄷ</code>, <code>/ㄷㅇㄱ</code>, <code>/ㅅㅎㅎㅇ</code>)을 즉각 불러옵니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};