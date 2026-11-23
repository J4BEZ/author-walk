import { IMAGE_QUALITIES } from '../api/openaiImageApi.js';
import { useSummaryBookCoverGenerator } from '../hooks/useSummaryBookCoverGenerator.js';

/**
 * 부모는 작품·장르·요약이 바뀌면 key를 바꿔 이전 미리보기와 요청을 초기화합니다.
 * @param {{ title: string, author: string, genre: string, summary: string, userApiKey: string,
 * disabled?: boolean, onSave?: (dataUrl: string) => Promise<void> }} props
 */
export default function SummaryBookCoverGenerator({ title, author, genre, summary, userApiKey, disabled = false, onSave }) {
  const { selectedQuality, setSelectedQuality, cover, generating, saving, error, message, generate, save } =
    useSummaryBookCoverGenerator({ title, author, genre, summary, userApiKey, onSave });
  const busy = generating || saving;
  const canGenerate = !disabled && !busy && Boolean(userApiKey.trim() && genre.trim() && summary.trim());

  return (
    <section aria-busy={busy}>
      <h3>장르·요약 기반 AI 표지 생성</h3>
      <p>위에서 확인한 장르·표지용 요약과 작품 제목·작성자로 생성합니다. 전문과 독자용 소개글은 보내지 않습니다.</p>
      <p>위 분석 화면에 입력한 API 키를 사용하며, 이미지 생성에는 별도 API 요금이 발생합니다.</p>
      <label>
        이미지 품질
        <select value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)} disabled={busy || disabled}>
          {IMAGE_QUALITIES.map((quality) => <option key={quality} value={quality}>{quality}</option>)}
        </select>
      </label>
      <button type="button" onClick={generate} disabled={!canGenerate}>
        {generating ? '요약 기반 표지 생성 중…' : '장르·요약으로 표지 생성'}
      </button>
      {(!genre.trim() || !summary.trim()) && <p>장르와 표지 제작용 요약을 먼저 분석하거나 입력해 주세요.</p>}
      {generating && <p role="status">장르와 요약으로 표지를 생성하고 있습니다.</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {cover && (
        <div>
          <img src={cover} alt={`${title} 장르·요약 기반 표지 미리보기`} width={280} />
          {onSave && <button type="button" onClick={save} disabled={busy || disabled}>
            {saving ? '저장 중…' : '이 요약 기반 표지 저장'}
          </button>}
          {onSave && <p>저장하면 현재 작품 표지가 교체됩니다. 위 본인 확인란의 아이디와 비밀번호가 필요합니다.</p>}
        </div>
      )}
    </section>
  );
}
