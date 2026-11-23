import { useEffect, useRef, useState } from 'react';
import { generateSummaryBookCover } from './openaiSummaryImageApi.js';

/**
 * @param {{ title: string, author: string, genre: string, summary: string, userApiKey: string,
 * onSave?: (dataUrl: string) => Promise<void> }} options
 */
export function useSummaryBookCoverGenerator({ title, author, genre, summary, userApiKey, onSave }) {
  const [selectedQuality, setSelectedQuality] = useState('medium');
  const [cover, setCover] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; controllerRef.current?.abort(); };
  }, []);

  const generate = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const image = await generateSummaryBookCover({ title, author, genre, summary, userApiKey, selectedQuality, signal: controller.signal });
      if (!controller.signal.aborted) setCover(image);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof TypeError ? 'OpenAI에 연결하지 못했습니다. 네트워크를 확인해 주세요.'
        : e instanceof Error ? e.message : '표지 생성에 실패했습니다.');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setGenerating(false);
    }
  };

  const save = async () => {
    if (!cover || !onSave || busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await onSave(cover);
      if (mountedRef.current) setMessage('요약 기반 표지를 저장했습니다.');
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error && e.cause === 'NOT_OWNER' ? e.message
        : '표지 저장에 실패했습니다. 도서 서버 연결을 확인하고 다시 저장해 주세요.');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  return { selectedQuality, setSelectedQuality, cover, generating, saving, error, message, generate, save };
}
