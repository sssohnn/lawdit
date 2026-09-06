import { useState, useEffect, useCallback } from 'react';

export interface LawditDocument {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const STORAGE_KEY = 'lawdit-docs-store';
const ACTIVE_DOC_ID_KEY = 'lawdit-active-doc-id';

const DEFAULT_DOC: LawditDocument = {
  id: 'doc-default',
  title: '청구원인 (공사대금)',
  content: `
    <h2>청 구 원 인</h2>
    <p>1. 공사대금 청구</p>
    <p>&nbsp;&nbsp;가. 청구권의 발생 (요건사실)</p>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;① 도급계약(공사계약) 체결 사실</p>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;② 공사의 완성 사실</p>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;③ (보수 약정이 있는 경우) 보수액 약정 사실</p>
  `,
  updatedAt: Date.now(),
};

export function useDocumentStore() {
  const [documents, setDocuments] = useState<LawditDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [DEFAULT_DOC];
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_DOC_ID_KEY) || DEFAULT_DOC.id;
  });

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0] || DEFAULT_DOC;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_DOC_ID_KEY, activeDocId);
  }, [activeDocId]);

  // 실시간 문서 본문 및 제목 자동 업데이트
  const updateCurrentDoc = useCallback((html: string, plainText: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== activeDocId) return doc;

        // 첫 번째 줄이나 의미 있는 단어로 문서 제목 자동 추출
        const firstLine = plainText.trim().split('\n')[0]?.trim();
        const title = firstLine && firstLine.length > 0 ? firstLine.slice(0, 24) : '제목 없는 서면';

        return {
          ...doc,
          title,
          content: html,
          updatedAt: Date.now(),
        };
      })
    );
  }, [activeDocId]);

  // 새 서면 추가
  const createNewDoc = useCallback(() => {
    const newDoc: LawditDocument = {
      id: `doc-${Date.now()}`,
      title: '새 서면',
      content: '<p></p>',
      updatedAt: Date.now(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    return newDoc;
  }, []);

  // 문서 삭제
  const removeDoc = useCallback((id: string) => {
    setDocuments((prev) => {
      if (prev.length <= 1) {
        alert('최소 1개의 서면은 유지되어야 합니다.');
        return prev;
      }
      const filtered = prev.filter((d) => d.id !== id);
      if (activeDocId === id) {
        setActiveDocId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeDocId]);

  return {
    documents,
    activeDoc,
    activeDocId,
    setActiveDocId,
    updateCurrentDoc,
    createNewDoc,
    removeDoc,
  };
}