import React, { useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Image as TipTapImage } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Trash2, Maximize2 } from 'lucide-react';

const ResizableImageComponent = ({ node, updateAttributes, deleteNode, selected }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = containerRef.current ? containerRef.current.getBoundingClientRect().width : 300;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.round(startWidth + deltaX));
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
      style={{
        display: 'inline-flex',
        margin: '6px 0',
        lineHeight: 0,
        verticalAlign: 'middle',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: node.attrs.width || 'auto',
          maxWidth: '100%',
          outline: selected ? '2px solid #3b82f6' : '1px solid transparent',
          borderRadius: '4px',
          transition: 'outline 0.15s ease',
        }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        />

        {showControls && (
          <>
            {/* 상단 플로팅 캡슐 툴바 */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '-32px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                padding: '3px 6px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 40,
              }}
            >
              {(['33%', '50%', '75%', '100%'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateAttributes({ width: w })}
                  style={{
                    border: 'none',
                    background: node.attrs.width === w ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: node.attrs.width === w ? '#ffffff' : '#94a3b8',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {w}
                </button>
              ))}

              <div style={{ width: '1px', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 2px' }} />

              <button
                type="button"
                onClick={deleteNode}
                title="사진 삭제"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#f87171',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* 우하단 리사이즈 핸들 */}
            <div
              onMouseDown={handleMouseDown}
              title="크기 조절"
              style={{
                position: 'absolute',
                right: '-6px',
                bottom: '-6px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '2px solid #2563eb',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                cursor: 'nwse-resize',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Maximize2 size={7} color="#2563eb" style={{ transform: 'rotate(90deg)' }} />
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = TipTapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: (attributes) => ({
          width: attributes.width,
          style: `width: ${attributes.width}; max-width: 100%;`,
        }),
        parseHTML: (element) => element.getAttribute('width') || element.style.width || 'auto',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});