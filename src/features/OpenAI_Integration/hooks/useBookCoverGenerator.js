// 표지 생성 State 와 OpenAI API 를 잇는 커스텀 훅 입니다.
// 생성, 저장, 로딩, 에러 처리는 여기서 하고 화면에는 필요한 값과 함수를 내려 줍니다.

import { useState, useEffect, useRef } from 'react';
import { generateBookCover } from '../api/openaiImageApi.js';

/** @import { BookView } from '../../books/types.js' */
/** @import { ImageQuality } from '../api/openaiImageApi.js' */

/**
 * 에러를 화면에 보여 줄 문구로 바꿉니다
 * @param {unknown} e
 * @returns {string}
 */
function toMessage(e) {
  if (e instanceof TypeError) {
    return 'OpenAI에 연결하지 못했습니다. 네트워크 연결을 확인해 주세요.';
  }
  return e instanceof Error ? e.message : '표지 생성에 실패했습니다.';
}

/**
 * 표지 생성 화면용 훅 : 입력값, 미리보기와 생성, 저장 함수를 돌려줍니다
 * @param {{ book: BookView, onSave: (dataUrl: string) => Promise<void> }} options
 * @returns {{
 *   userApiKey: string, setUserApiKey: import('react').Dispatch<import('react').SetStateAction<string>>,
 *   selectedQuality: ImageQuality, setSelectedQuality: import('react').Dispatch<import('react').SetStateAction<ImageQuality>>,
 *   cover: string, generating: boolean, saving: boolean, error: string | null, message: string | null,
 *   generateCover: () => Promise<void>, saveCover: () => Promise<void>,
 * }} 훅에서 제공하는 값들 (입력, 로딩, 에러 상태와 생성, 저장 함수)
 */
export function useBookCoverGenerator({ book, onSave }) {
  // API 키는 화면 State 에만 두고 파일이나 DB 에 저장하지 않음
  const [userApiKey, setUserApiKey] = useState('');
  const [selectedQuality, setSelectedQuality] = useState(/** @type {ImageQuality} */ ('medium'));
  const [cover, setCover] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [message, setMessage] = useState(/** @type {string | null} */ (null));
  const controllerRef = useRef(/** @type {AbortController | null} */ (null));
  const busyRef = useRef(false); // State 반영 전에 다시 눌러도 중복 요청을 막기

  // 다른 도서를 선택하거나 화면을 닫으면 진행 중인 브라우저 요청 취소
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  // 새 요청을 시작할 때 이전 에러와 완료 문구를 비우기
  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  /**
   * 생성 : 입력값으로 OpenAI 요청 -> 미리보기 갱신 (아직 DB 에 저장하지 않음)
   * @returns {Promise<void>}
   */
  const generateCover = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerating(true);
    setCover('');
    clearFeedback();

    try {
      const image = await generateBookCover({
        book,
        userApiKey,
        selectedQuality,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setCover(image);
    } catch (e) {
      // 화면 이동으로 취소한 요청은 에러 문구를 보여 주지 않음
      if (!controller.signal.aborted) setError(toMessage(e));
    } finally {
      busyRef.current = false;
      if (!controller.signal.aborted) setGenerating(false);
    }
  };

  /**
   * 저장 : 미리보기의 Data URL 을 부모의 도서 저장 함수로 넘깁니다
   * @returns {Promise<void>}
   */
  const saveCover = async () => {
    if (!cover || busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    clearFeedback();

    try {
      await onSave(cover);
      setMessage('도서 표지를 저장했습니다.');
    } catch {
      setError('표지 저장에 실패했습니다. 도서 서버 연결을 확인하고 다시 저장해 주세요.');
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  };

  return {
    userApiKey, setUserApiKey,
    selectedQuality, setSelectedQuality,
    cover, generating, saving, error, message,
    generateCover, saveCover,
  };
}
