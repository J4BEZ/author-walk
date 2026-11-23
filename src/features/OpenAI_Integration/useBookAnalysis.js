import { useEffect, useRef, useState } from 'react';
import { analyzeBook } from './openaiBookAnalysisApi.js';

/**
 * 부모는 작품 id/제목/본문이 바뀌면 key를 바꿔 이전 분석 상태를 초기화합니다.
 * @param {{ book: { title: string, content: string } }} options
 */
export function useBookAnalysis({ book }) {
  const [userApiKey, setUserApiKey] = useState('');
  const [genre, setGenre] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [summary, setSummary] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const analyze = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setAnalyzing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await analyzeBook({ book, userApiKey, signal: controller.signal });
      if (!controller.signal.aborted) {
        setGenre(result.genre);
        setIntroduction(result.introduction);
        setSummary(result.summary);
        setWarnings(result.warnings);
        setMessage('분석이 완료됐습니다. 예상 장르, 독자용 소개글과 표지용 요약을 확인·수정해 주세요.');
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof TypeError ? 'OpenAI에 연결하지 못했습니다. 네트워크 연결을 확인해 주세요.'
          : e instanceof Error ? e.message : '작품 분석에 실패했습니다.');
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setAnalyzing(false);
    }
  };

  return { userApiKey, setUserApiKey, genre, setGenre, introduction, setIntroduction, summary, setSummary, warnings,
    analyzing, error, message, analyze };
}
