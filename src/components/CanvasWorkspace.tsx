import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import { StickyNote, X } from 'lucide-react';
import { FreeformLayer, type VisualItem } from './FreeformLayer';

export interface ScratchpadNote {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface CanvasWorkspaceProps {
  editor: Editor | null;
  visualItems: VisualItem[];
  onUpdateVisualItems: (items: VisualItem[]) => void;
  orientation: 'portrait' | 'landscape';
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  editor,
  visualItems,
  onUpdateVisualItems,
  orientation,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const a4PaperRef = useRef<HTMLDivElement>(null);

  // 24px 모눈 격자 정수 배수 규격
  const a4Width = orientation === 'portrait' ? 816 : 1152;
  const a4PageHeight = orientation === 'portrait' ? 1152 : 816;

  const [pageCount, setPageCount] = useState<number>(1);
  const [scratchpads, setScratchpads] = useState<ScratchpadNote[]>([]);

  // 초기 렌더링 시 A4 정중앙 스크롤 위치 보정
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollMaxX = container.scrollWidth - container.clientWidth;
    container.scrollTo({
      left: Math.max(0, scrollMaxX / 2),
      top: 450,
      behavior: 'instant',
    });
  }, [orientation]);

  // 페이지 분기선 동적 계산
  useEffect(() => {
    const paper = a4PaperRef.current;
    if (!paper) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currentHeight = entry.contentRect.height;
        const calculatedPages = Math.max(1, Math.ceil(currentHeight / a4PageHeight));
        setPageCount(calculatedPages);
      }
    });

    observer.observe(paper);
    return () => observer.disconnect();
  }, [a4PageHeight]);

  // A4 여백 더블클릭 시 포스트잇 메모 생성
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (a4PaperRef.current?.contains(e.target as Node)) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + container.scrollLeft;
    const clickY = e.clientY - rect.top + container.scrollTop;

    setScratchpads((prev) => [
      ...prev,
      { id: `scratch-${Date.now()}`, x: clickX, y: clickY, text: '' },
    ]);
  };

  return (
    <div
      ref={scrollContainerRef}
      onDoubleClick={handleCanvasDoubleClick}
      style={{
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 74px)',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: '#cbd5e1', // 스크롤 바운스 전체를 덮는 베이스
        backgroundImage: `
          linear-gradient(to right, rgba(100, 116, 139, 0.25) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(100, 116, 139, 0.25) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        overscrollBehavior: 'none',
      }}
    >
      {/* 
        360도 무한 모눈 작업대 본체
        중앙 집중 대칭 구조를 통해 좌측 끝단 클리핑을 원천 차단
      */}
      <div
        style={{
          width: 'max(100%, 3600px)',
          minHeight: `${Math.max(a4PageHeight * pageCount, 1200) + 1600}px`,
          position: 'relative',
          padding: '500px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'transparent',
          backgroundImage: `
            linear-gradient(to right, rgba(100, 116, 139, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        {/* A4 인쇄 대상 영역: 모눈이 투과되는 밝은 틴트 음영 + 점선 테두리 */}
        <div
          ref={a4PaperRef}
          className="lawdit-print-target"
          style={{
            width: `${a4Width}px`,
            minHeight: `${a4PageHeight}px`,
            position: 'relative',
            backgroundColor: 'rgba(255, 255, 255, 0.88)', // 하부 모눈이 비치는 반투명 A4
            border: '2px dashed #2563eb', // PDF 기준 점선 가이드
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.15)',
            padding: '72px 80px',
            zIndex: 10,
          }}
        >
          {/* 가이드 인디케이터 */}
          <div
            className="print-hide"
            style={{
              position: 'absolute',
              top: '-26px',
              left: 0,
              fontSize: '11px',
              fontWeight: '700',
              color: '#2563eb',
              userSelect: 'none',
            }}
          >
            PDF 인쇄 영역 ({orientation === 'portrait' ? '세로 모드 816px' : '가로 모드 1152px'})
          </div>

          <EditorContent editor={editor} />

          {/* 동적 절취선 및 PAGE 배지 */}
          {Array.from({ length: pageCount - 1 }).map((_, index) => {
            const cutY = (index + 1) * a4PageHeight;
            return (
              <div
                key={`page-divider-${index + 2}`}
                className="print-hide"
                style={{
                  position: 'absolute',
                  top: `${cutY}px`,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                <div style={{ flex: 1, borderBottom: '2px dashed #ef4444' }} />
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    margin: '0 12px',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                  }}
                >
                  PAGE {index + 2} 절취선
                </span>
                <div style={{ flex: 1, borderBottom: '2px dashed #ef4444' }} />
              </div>
            );
          })}
        </div>

        {/* 프리폼 이미지 부유 레이어 */}
        <FreeformLayer items={visualItems} onUpdateItems={onUpdateVisualItems} />

        {/* 바깥 작업대 포스트잇 메모 */}
        {scratchpads.map((note) => (
          <div
            key={note.id}
            className="print-hide"
            style={{
              position: 'absolute',
              top: `${note.y}px`,
              left: `${note.x}px`,
              width: '220px',
              backgroundColor: '#fef08a',
              borderRadius: '6px',
              boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
              border: '1px solid #fde047',
              padding: '10px',
              zIndex: 35,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <StickyNote size={12} /> 작업대 메모
              </span>
              <button
                type="button"
                onClick={() => setScratchpads((prev) => prev.filter((n) => n.id !== note.id))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#854d0e' }}
              >
                <X size={12} />
              </button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setScratchpads((prev) => prev.map((n) => (n.id === note.id ? { ...n, text: val } : n)));
              }}
              placeholder="자유 메모 입력..."
              style={{
                width: '100%',
                height: '75px',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#422006',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};