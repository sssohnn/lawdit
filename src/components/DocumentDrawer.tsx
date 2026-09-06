import React from 'react';
import { X, Plus, FileText, Trash2, Calendar } from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
  onDeleteDoc: (id: string) => void;
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  activeDocId,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '360px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            서면 보관함 ({documents.length})
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onNewDoc();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <Plus size={14} /> 새 서면 작성
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            const snippetText = doc.content.replace(/<[^>]*>/g, '').trim().slice(0, 80);

            return (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDoc(doc.id);
                  onClose();
                }}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color={isActive ? '#2563eb' : '#64748b'} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{doc.title}</span>
                  </div>
                  {documents.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${doc.title}' 서면을 삭제하시겠습니까?`)) {
                          onDeleteDoc(doc.id);
                        }
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                  {snippetText || '(작성된 본문 없음)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#94a3b8' }}>
                  <Calendar size={10} />
                  {new Date(doc.updatedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};