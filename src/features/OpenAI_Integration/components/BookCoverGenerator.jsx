// AI 표지 생성 화면 : 입력, 미리보기와 저장
// OpenAI 요청과 State 관리는 useBookCoverGenerator 에서 처리합니다.

import { IMAGE_QUALITIES } from '../api/openaiImageApi.js';
import { useBookCoverGenerator } from '../hooks/useBookCoverGenerator.js';

import '../../../styles/BookCoverGenerator.css';

/** @import { BookView } from '../books/types.js' */
/** @import { ImageQuality } from '../api/openaiImageApi.js' */

/**
 * 표지 생성 화면 : API 키, 품질 입력 -> 생성 -> 미리보기 -> 저장
 * @param {{ book: BookView, onSave: (dataUrl: string) => Promise<void> }} props
 */
function BookCoverGenerator({ book, onSave }) {
  const {
    userApiKey, setUserApiKey,
    selectedQuality, setSelectedQuality,
    cover, generating, saving, error, message,
    generateCover, saveCover,
  } = useBookCoverGenerator({ book, onSave });

  // 생성이나 저장 중에는 입력과 버튼을 잠그고, 본문과 키가 있어야 생성 가능
  const busy = generating || saving;
  const hasContent = Boolean(book.content?.trim());
  const canGenerate = !busy && hasContent && Boolean(userApiKey.trim());

  // 폼 제출 : 새로고침을 막고 훅의 생성 함수를 호출
  const handleSubmit = (/** @type {import('react').SubmitEvent<HTMLFormElement>} */ e) => {
    e.preventDefault();
    generateCover();
  };

  return (
    <div className="book-cover-generator" aria-busy={busy}>
      {/* 생성에 필요한 입력 */}
      <form className="cover-gen-form" onSubmit={handleSubmit}>
        <label className="cover-gen-field cover-gen-field--key">
          OpenAI API 키
          <input
            type="password"
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            spellCheck={false}
            required
            disabled={busy}
          />
        </label>

        <label className="cover-gen-field">
          이미지 품질
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(/** @type {ImageQuality} */ (e.target.value))}
            disabled={busy}
          >
            {IMAGE_QUALITIES.map((quality) => (
              <option key={quality} value={quality}>{quality}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="cover-gen-submit" disabled={!canGenerate}>
          {generating ? '표지 생성 중…' : '표지 생성'}
        </button>
      </form>

      {/* 로딩 -> 에러 -> 완료 문구 */}
      {generating && <p className="cover-gen-status cover-gen-status--loading" role="status">이미지를 생성하고 있습니다. 잠시 기다려 주세요.</p>}
      {error && <p className="cover-gen-error" role="alert">{error}</p>}
      {message && <p className="cover-gen-status" role="status">{message}</p>}

      {cover && (
        <div className="cover-gen-result">
          <img
            className="generated-cover"
            src={cover}
            alt={`${book.title} AI 생성 표지 미리보기`}
          />
          <button type="button" className="cover-gen-save" onClick={saveCover} disabled={busy}>
            {saving ? '저장 중…' : '이 표지 저장'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookCoverGenerator;
