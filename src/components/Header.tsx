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
  FileText,
  Crosshair,
} from 'lucide-react';
import type { LawditDocument } from '../hooks/useDocumentStore';

export interface WorkspaceTheme {
  id: string;
  name: string;
  canvasBg: string;
  gridLine: string;
  docBg: string;
  accentDot: string;
}

export const THEMES: WorkspaceTheme[] = [
  {
    id: 'cool-slate',
    name: '슬레이트 그리드',
    canvasBg: '#f1f5f9',
    gridLine: 'rgba(148, 163, 184, 0.35)',
    docBg: 'rgba(255, 255, 255, 0.88)',
    accentDot: '#38bdf8',
  },
  {
    id: 'architect-blue',
    name: '아키텍트 모눈',
    canvasBg: '#e2e8f0',
    gridLine: 'rgba(59, 130, 246, 0.25)',
    docBg: 'rgba(255, 255, 255, 0.90)',
    accentDot: '#2563eb',
  },
  {
    id: 'warm-ivory',
    name: '아이보리 레포트',
    canvasBg: '#f6f4ef',
    gridLine: 'rgba(215, 204, 185, 0.55)',
    docBg: 'rgba(255, 255, 255, 0.86)',
    accentDot: '#c2a67e',
  },
  {
    id: 'midnight',
    name: '다크 옵시디언',
    canvasBg: '#0b0f19',
    gridLine: 'rgba(51, 65, 85, 0.5)',
    docBg: 'rgba(23, 32, 51, 0.88)',
    accentDot: '#818cf8',
  },
];

interface HeaderProps {
  editor: Editor | null;
  onImageClick: () => void;
  currentTheme: WorkspaceTheme;
  isThemePickerOpen: boolean;
  setIsThemePickerOpen: (open: boolean) => void;
  onThemeChange: (theme: WorkspaceTheme) => void;
  orientation: 'portrait' | 'landscape';
  onOrientationChange: (mode: 'portrait' | 'landscape') => void;
  documents: LawditDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
  onResetView: () => void;
  onExportPdf: () => void;
  timeLeft: number;
  isTimerRunning: boolean;
  isTimerPickerOpen: boolean;
  setIsTimerPickerOpen: (open: boolean) => void;
  formattedTime: string;
  selectedDuration: number;
  presets: { label: string; val: number }[];
  onTimerToggle: () => void;
  onTimerReset: (val?: number) => void;
  onCopy: () => void;
  copyFeedback: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  editor,
  onImageClick,
  currentTheme,
  isThemePickerOpen,
  setIsThemePickerOpen,
  onThemeChange,
  orientation,
  onOrientationChange,
  documents,
  activeDocId,
  onSelectDoc,
  onNewDoc,
  onResetView,
  onExportPdf,
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
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  if (!editor) return null;

  const toolBtnStyle = (isActive = false, isDisabled = false) => ({
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '5px',
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

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
          padding: '6px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* 좌측: 로고, 새 서면, 탭 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Scale size={13} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
              Lawdit
            </span>
          </div>

          <button
            type="button"
            onClick={onNewDoc}
            title="새 서면 생성"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '5px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <FilePlus2 size={12} color="#2563eb" />
            새 서면
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              maxWidth: '300px',
              padding: '2px 0',
            }}
          >
            {documents.map((doc, idx) => {
              const isSelected = doc.id === activeDocId;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => onSelectDoc(doc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: isSelected ? '1px solid #2563eb' : '1px solid transparent',
                    backgroundColor: isSelected ? '#eff6ff' : 'rgba(241, 245, 249, 0.8)',
                    color: isSelected ? '#1d4ed8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={10} color={isSelected ? '#2563eb' : '#94a3b8'} />
                  {idx + 1}. {doc.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* 중앙: 서식 툴바 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '2px',
            gap: '1px',
          }}
        >
          <button type="button" title="굵게" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} style={toolBtnStyle(editor.isActive('bold'))}><Bold size={13} /></button>
          <button type="button" title="기울임" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} style={toolBtnStyle(editor.isActive('italic'))}><Italic size={13} /></button>
          <button type="button" title="밑줄" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} style={toolBtnStyle(editor.isActive('underline'))}><UnderlineIcon size={13} /></button>
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

          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

          <button type="button" title="표제 (H2)" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={toolBtnStyle(editor.isActive('heading', { level: 2 }))}><Heading2 size={13} /></button>
          <button type="button" title="판례 인용구" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolBtnStyle(editor.isActive('blockquote'))}><Quote size={13} /></button>
          <button type="button" title="들여쓰기" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertContent('\u00a0\u00a0').run()} style={toolBtnStyle(false)}><Indent size={13} /></button>
          <button type="button" title="사진 삽입" onMouseDown={(e) => e.preventDefault()} onClick={onImageClick} style={toolBtnStyle(false)}><ImageIcon size={13} /></button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

          <button type="button" title="실행 취소" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} style={toolBtnStyle(false, !editor.can().undo())}><Undo2 size={13} /></button>
          <button type="button" title="다시 실행" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} style={toolBtnStyle(false, !editor.can().redo())}><Redo2 size={13} /></button>
        </div>

        {/* 우측: 토글, 정렬, 테마, 타이머, PDF 생성, 전체 복사 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 가로모드 / 세로모드 토글 */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => onOrientationChange('landscape')}
              style={{
                padding: '3px 8px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: orientation === 'landscape' ? '700' : '500',
                backgroundColor: orientation === 'landscape' ? '#ffffff' : 'transparent',
                color: orientation === 'landscape' ? '#0f172a' : '#64748b',
                boxShadow: orientation === 'landscape' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              가로모드
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange('portrait')}
              style={{
                padding: '3px 8px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: orientation === 'portrait' ? '700' : '500',
                backgroundColor: orientation === 'portrait' ? '#ffffff' : 'transparent',
                color: orientation === 'portrait' ? '#0f172a' : '#64748b',
                boxShadow: orientation === 'portrait' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              세로모드
            </button>
          </div>

          <button
            type="button"
            title="캔버스 중앙 정렬"
            onClick={onResetView}
            style={{
              ...toolBtnStyle(false),
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Crosshair size={13} />
          </button>

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
            <HelpCircle size={13} />
          </button>

          {/* 모눈 테마 선택기 */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              title="캔버스 배경 격자 테마"
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              style={{
                ...toolBtnStyle(isThemePickerOpen),
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                width: 'auto',
                padding: '0 6px',
                gap: '4px',
              }}
            >
              <Palette size={12} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: currentTheme.accentDot }} />
            </button>

            {isThemePickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '34px',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 120,
                  minWidth: '130px',
                }}
              >
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onThemeChange(th)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: currentTheme.id === th.id ? '#f1f5f9' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: currentTheme.id === th.id ? '700' : '400',
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
          </div>

          {/* 타이머 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              backgroundColor: timeLeft < 300 && isTimerRunning ? '#fef2f2' : '#ffffff',
              padding: '1px 3px',
              gap: '2px',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setIsTimerPickerOpen(!isTimerPickerOpen)}
              title="시험 시간 선택"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '11px',
                fontWeight: '700',
                color: timeLeft < 300 && isTimerRunning ? '#dc2626' : '#1e293b',
              }}
            >
              <Timer size={11} />
              {formattedTime}
            </button>
            <button
              type="button"
              onClick={onTimerToggle}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: isTimerRunning ? '#dc2626' : '#2563eb' }}
            >
              {isTimerRunning ? <Pause size={10} /> : <Play size={10} />}
            </button>
            <button
              type="button"
              onClick={() => onTimerReset()}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
            >
              <RotateCcw size={10} />
            </button>

            {isTimerPickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 120,
                  minWidth: '120px',
                }}
              >
                {presets.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      onTimerReset(p.val);
                      setIsTimerPickerOpen(false);
                    }}
                    style={{
                      padding: '5px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: selectedDuration === p.val ? '#f1f5f9' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: selectedDuration === p.val ? '700' : '400',
                      color: '#1e293b',
                      textAlign: 'left',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 요구사항 4: 단일 작업 서면 전용 PDF 생성 및 다운로드 버튼 */}
          <button
            type="button"
            title="현재 작업 중인 서면 PDF 생성 및 다운로드"
            onClick={onExportPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              height: '28px',
              padding: '0 9px',
              backgroundColor: '#ffffff',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '5px',
              border: '1px solid #bfdbfe',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            <Printer size={12} color="#2563eb" />
            PDF 생성
          </button>

          {/* 텍스트 내보내기 보조 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              title="텍스트 파일로 저장"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              style={{
                ...toolBtnStyle(isExportMenuOpen),
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Download size={13} />
            </button>

            {isExportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '34px',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 120,
                  minWidth: '130px',
                }}
              >
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  style={{
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={11} color="#2563eb" />
                  텍스트 저장 (.txt)
                </button>
              </div>
            )}
          </div>

          {/* 전체 복사 버튼 */}
          <button
            type="button"
            title="HWP 바탕글 서식 무손실 복사"
            onClick={onCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              height: '28px',
              padding: '0 10px',
              backgroundColor: copyFeedback ? '#15803d' : '#0f172a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {copyFeedback ? <Check size={11} /> : <Copy size={11} />}
            {copyFeedback ? '완료' : '복사'}
          </button>
        </div>
      </header>

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
              borderRadius: '10px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '440px',
              padding: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} color="#2563eb" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Lawdit 실무 가이드</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', color: '#334155' }}>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>📌 계층형 들여쓰기 조작</strong>
                <div style={{ color: '#475569', lineHeight: '1.5' }}>
                  • <code>Tab</code>: 현재 들여쓰기 깊이에서 직계 하위 기호로 변경되며 +2칸 들여쓰기<br />
                  • <code>Shift + Tab</code>: 상위 기호로 복귀하며 2칸 내어쓰기<br />
                  • <code>Enter</code>: 같은 번호/문자 체계 자동 증분 (내용 없는 빈 기호에서 Enter 시 탈출)
                </div>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>📌 캔버스 내비게이션 & PDF</strong>
                <div style={{ color: '#475569', lineHeight: '1.5' }}>
                  • 배경 드래그 / Space+드래그: 360도 무한 팬 이동<br />
                  • <code>PDF 생성</code>: 현재 작업 중인 단일 서면(다중 페이지)만 A4 규격으로 즉시 출력/저장
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};