import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface SlashMenuItem {
  id: string;
  type?: 'claim' | 'defense' | 'statute' | 'case';
  category: string;
  triggers: string[];
  title: string;
  reference?: string;
  description?: string;
  isInline?: boolean;
  snippetTitle: string;
  items: string[];
  isVerified?: boolean;
}

interface SlashMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  items: SlashMenuItem[];
  selectedIndex: number;
  onSelect: (item: SlashMenuItem) => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  position,
  items,
  selectedIndex,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 키보드 방향키 이동 시 선택 항목으로 자동 스크롤 추적
  useEffect(() => {
    if (isOpen && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
        width: '380px',
        maxHeight: '320px',
        overflowY: 'auto',
        padding: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          padding: '6px 8px',
          marginBottom: '4px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '6px',
          fontSize: '11px',
          lineHeight: '1.4',
          color: '#b45309',
        }}
      >
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>요건사실 자동완성</strong>: 초안 데이터이므로 실제 소송 및 시험 적용 시 법률가의 확인이 필요합니다.
        </div>
      </div>

      <div
        style={{
          padding: '4px 8px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#64748b',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        법률 데이터 목록 ({items.length}건)
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          일치하는 법률 서식이 없습니다.
        </div>
      ) : (
        items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onMouseDown={(e) => {
                // 커서 포커스 탈취 방지
                e.preventDefault();
                onSelect(item);
              }}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                    {item.title}
                  </span>
                  {item.reference && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      ({item.reference})
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: '600',
                  }}
                >
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {item.description}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};