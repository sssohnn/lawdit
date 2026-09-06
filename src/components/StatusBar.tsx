import React from 'react';

interface StatusBarProps {
  charsWithSpaces: number;
  charsWithoutSpaces: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  charsWithSpaces,
  charsWithoutSpaces,
}) => {
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#64748b',
        gap: '16px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#059669',
          fontSize: '11px',
          marginRight: 'auto',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#059669',
          }}
        />
        로컬 캐시 자동 저장됨
      </div>
      <div>
        복사 규격:{' '}
        <span style={{ color: '#0f172a', fontWeight: '600' }}>
          HWP 바탕글 서식 상속
        </span>
      </div>
      <div style={{ width: '1px', height: '12px', backgroundColor: '#cbd5e1' }} />
      <div>
        공백 제외:{' '}
        <span style={{ color: '#0f172a', fontWeight: '600' }}>
          {charsWithoutSpaces}
        </span>
        자
      </div>
      <div style={{ width: '1px', height: '12px', backgroundColor: '#cbd5e1' }} />
      <div>
        공백 포함:{' '}
        <span style={{ color: '#0f172a', fontWeight: '600' }}>
          {charsWithSpaces}
        </span>
        자
      </div>
    </footer>
  );
};