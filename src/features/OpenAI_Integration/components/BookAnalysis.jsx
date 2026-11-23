import { useBookAnalysis } from '../hooks/useBookAnalysis.js';
import { BOOK_ANALYSIS_LIMITS } from '../api/openaiBookAnalysisApi.js';
import SummaryBookCoverGenerator from './SummaryBookCoverGenerator.jsx';

/** @param {{ book: { title: string, author: string, content: string }, onSaveCover?: (dataUrl: string) => Promise<void> }} props */
export default function BookAnalysis({ book, onSaveCover }) {
  const { userApiKey, setUserApiKey, genre, setGenre, introduction, setIntroduction, summary, setSummary, warnings,
    analyzing, error, message, analyze } = useBookAnalysis({ book });
  const busy = analyzing;

  return (
    <section className="book-analysis" aria-busy={busy}>
      <h3>AI 예상 장르·소개글·표지용 요약</h3>
      <p>작품 전문을 OpenAI로 보내 한 번에 분석합니다. API 요금이 발생하며, 표지용 요약에는 결말이 포함될 수 있습니다.</p>
      <form onSubmit={(e) => { e.preventDefault(); analyze(); }}>
        <label>
          OpenAI API 키
          <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)}
            autoComplete="off" spellCheck={false} placeholder="sk-…" required disabled={busy} />
        </label>
        <p>키는 이 화면의 메모리에만 유지하며 작품과 함께 저장하지 않습니다.</p>
        <button type="submit" disabled={busy || !userApiKey.trim() || !book.content?.trim()}>
          {analyzing ? '작품 분석 중…' : '장르·소개글·표지용 요약 만들기'}
        </button>
      </form>
      {!book.content?.trim() && <p>분석할 작품 내용이 없습니다.</p>}
      {analyzing && <p role="status">작품 전문을 읽고 있습니다. 잠시 기다려 주세요.</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {warnings.length > 0 && (
        <div role="status">
          <h4>분석 시 확인할 사항</h4>
          <p>원문에 분석 지시로 의심되는 내용이 있습니다. AI의 참고 판단이며 작품 차단 사유는 아닙니다.</p>
          {/* AI 결과는 HTML이나 명령으로 실행하지 않고 React 텍스트로만 표시합니다. */}
          <ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </div>
      )}
      <div className="book-analysis-result">
        <p>AI가 작성한 결과입니다. 각 항목을 확인·수정할 수 있습니다. 현재 결과는 화면에서만 유지됩니다.</p>
        <label>
          예상 장르
          <input value={genre} onChange={(e) => setGenre(e.target.value)} disabled={busy}
            maxLength={BOOK_ANALYSIS_LIMITS.genre}
            placeholder="예: 현대소설, 사회소설" />
        </label>
        <label>
          독자용 소개글
          <textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} disabled={busy}
            maxLength={BOOK_ANALYSIS_LIMITS.introduction}
            rows={4} placeholder="결말을 공개하지 않고 인물과 중심 갈등을 소개합니다." />
        </label>
        <label>
          표지 제작용 요약
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} disabled={busy}
            maxLength={BOOK_ANALYSIS_LIMITS.summary}
            rows={7} placeholder="표지 구상에 필요한 배경·인물 관계·분위기·시각적 소재를 정리합니다." />
        </label>
        {(genre.trim() || introduction.trim() || summary.trim()) && (
          <details>
            <summary>분석 결과 JSON 확인</summary>
            <pre>{JSON.stringify({ genre: genre.trim(), introduction: introduction.trim(), summary: summary.trim(), warnings }, null, 2)}</pre>
          </details>
        )}
      </div>
      <SummaryBookCoverGenerator
        key={JSON.stringify([book.title, book.author, genre, summary])}
        title={book.title}
        author={book.author}
        genre={genre}
        summary={summary}
        userApiKey={userApiKey}
        disabled={busy}
        onSave={onSaveCover}
      />
    </section>
  );
}
