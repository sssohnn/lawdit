import { Editor } from '@tiptap/react';

/**
 * HWP 100% 무손실 텍스트 클립보드 직렬화 파서
 * - HTML 파싱 충돌을 방지하기 위해 blockSeparator를 유지한 순수 텍스트 전송
 * - 원문자(①~⑳), 탭/공백 들여쓰기 무손실 유지
 */
export async function copyForHWP(editor: Editor): Promise<boolean> {
  if (!editor) return false;

  const textContent = editor.getText({ blockSeparator: '\n' });

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(textContent);
      return true;
    }
    throw new Error('navigator.clipboard.writeText unavailable');
  } catch (err) {
    // Fallback: 임시 textarea를 활용한 동기식 클립보드 복사
    const textarea = document.createElement('textarea');
    textarea.value = textContent;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (fallbackErr) {
      document.body.removeChild(textarea);
      console.error('클립보드 복사 완전 실패:', fallbackErr);
      return false;
    }
  }
}