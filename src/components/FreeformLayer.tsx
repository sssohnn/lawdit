import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

export interface VisualItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface FreeformLayerProps {
  items: VisualItem[];
  onUpdateItems: (items: VisualItem[]) => void;
}

export const FreeformLayer: React.FC<FreeformLayerProps> = ({
  items,
  onUpdateItems,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
  }>({ startX: 0, startY: 0, initialX: 0, initialY: 0, initialWidth: 0, initialHeight: 0 });

  const handleDragStart = (e: React.MouseEvent, item: VisualItem) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveId(item.id);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialWidth: item.width,
      initialHeight: item.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      onUpdateItems(
        items.map((it) =>
          it.id === item.id
            ? { ...it, x: Math.round(dragRef.current.initialX + dx), y: Math.round(dragRef.current.initialY + dy) }
            : it
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, item: VisualItem) => {
    e.preventDefault();
    e.stopPropagation();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialWidth: item.width,
      initialHeight: item.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const newWidth = Math.max(120, Math.round(dragRef.current.initialWidth + dx));
      const aspectRatio = dragRef.current.initialHeight / dragRef.current.initialWidth;
      const newHeight = Math.round(newWidth * aspectRatio);

      onUpdateItems(
        items.map((it) =>
          it.id === item.id ? { ...it, width: newWidth, height: newHeight } : it
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const removeItem = (id: string) => {
    onUpdateItems(items.filter((it) => it.id !== id));
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {items.map((item) => {
        const isSelected = item.id === activeId;

        return (
          <div
            key={item.id}
            onMouseDown={() => setActiveId(item.id)}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
              pointerEvents: 'auto',
              cursor: 'grab',
              zIndex: item.zIndex,
              border: isSelected ? '2px solid #2563eb' : '1px solid transparent',
              boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : 'none',
              borderRadius: '4px',
              userSelect: 'none',
            }}
          >
            {/* 드래그 바 / 상단 핸들 */}
            <div
              onMouseDown={(e) => handleDragStart(e, item)}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <img
                src={item.src}
                alt="강의 시각 자료"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '2px',
                  display: 'block',
                  backgroundColor: '#ffffff',
                }}
              />

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 30,
                }}
              >
                <X size={11} />
              </button>

              {/* 우하단 크기 조절 핸들러 */}
              <div
                onMouseDown={(e) => handleResizeStart(e, item)}
                style={{
                  position: 'absolute',
                  right: '-6px',
                  bottom: '-6px',
                  width: '14px',
                  height: '14px',
                  backgroundColor: '#2563eb',
                  border: '2px solid #ffffff',
                  borderRadius: '2px',
                  cursor: 'nwse-resize',
                  zIndex: 30,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};