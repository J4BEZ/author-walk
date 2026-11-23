// booksApi 함수 확인용 한 페이지 (화면 디자인 아님, 팀원이 API 동작을 눈으로 확인하는 용도)
// 쓰는 법 : src/App.jsx 에서 이 컴포넌트를 임시로 import 해 보여 주면 됩니다.
import { useState } from 'react';
import {
  getBooks, getBook, createBook, checkOwner, updateBook, saveCover, deleteBook,
} from '../features/books/api/booksApi.js';

// 1x1 픽셀 PNG Data URL (saveCover 시험용, 실제로는 OpenAI 응답으로 만든 값)
const SAMPLE_COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * 결과를 보기 좋게 문자열로 (긴 Data URL 은 앞부분만)
 * @param {unknown} value
 * @returns {string}
 */
function pretty(value) {
  return JSON.stringify(
    value,
    (key, v) => (typeof v === 'string' && v.startsWith('data:') ? `${v.slice(0, 40)}... (${v.length}자)` : v),
    2,
  );
}

/**
 * 함수 하나를 시험하는 상자 : 제목, 요청 설명, 입력칸, 실행 버튼, 결과
 * @param {{ title: string, request: string, children?: import('react').ReactNode, onRun: () => Promise<unknown> }} props
 */
function ApiSection({ title, request, children, onRun }) {
  const [result, setResult] = useState('');
  const [running, setRunning] = useState(false);

  // 실행 : 성공하면 결과, 실패하면 에러 메시지와 상태 코드
  const handleRun = async () => {
    setRunning(true);
    try {
      const value = await onRun();
      setResult(value === undefined ? '완료 (돌려준 값 없음)' : pretty(value));
    } catch (e) {
      const err = /** @type {Error} */ (e);
      setResult(`에러 : ${err.name} / ${err.message}${err.cause ? ` / cause ${err.cause}` : ''}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <code>{request}</code>
      <div style={{ margin: '8px 0' }}>{children}</div>
      <button onClick={handleRun} disabled={running}>{running ? '실행 중...' : '실행'}</button>
      {result && <pre style={{ background: '#f5f5f5', padding: 8, whiteSpace: 'pre-wrap' }}>{result}</pre>}
    </section>
  );
}

function BooksApiPlayground() {
  // 여러 상자가 같이 쓰는 입력값
  const [id, setId] = useState('1');
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('홍길동');
  const [userId, setUserId] = useState('gildong1234');
  const [password, setPassword] = useState('1234');
  const [title, setTitle] = useState('새 책 제목');
  const [content, setContent] = useState('새 책 본문입니다.');

  const bookId = Number(id); // 입력칸은 문자열이라 숫자로

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <h1>booksApi 확인 페이지</h1>
      <p>json-server 를 켠 상태 (localhost:3000) 에서 각 상자의 실행 버튼을 누릅니다.</p>

      {/* 공통 입력 */}
      <fieldset style={{ marginBottom: 12 }}>
        <legend>공통 입력</legend>
        <label>도서 id <input value={id} onChange={(e) => setId(e.target.value)} size={4} /></label>{' '}
        <label>작성자 <input value={author} onChange={(e) => setAuthor(e.target.value)} /></label>{' '}
        <label>사용자 아이디 <input value={userId} onChange={(e) => setUserId(e.target.value)} /></label>{' '}
        <label>비밀번호 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      </fieldset>

      {/* 조회 */}
      <ApiSection title="getBooks(query)" request="GET /books?_sort=createdAt&_order=desc&q=검색어" onRun={() => getBooks(query)}>
        <label>검색어 (비우면 전체) <input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      </ApiSection>

      <ApiSection title="getBook(id)" request="GET /books/:id" onRun={() => getBook(bookId)} />

      {/* 등록 */}
      <ApiSection
        title="createBook(input)"
        request="POST /books"
        onRun={() => createBook({ title, author, userId, content, password })}
      >
        <label>제목 <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>{' '}
        <label>본문 <input value={content} onChange={(e) => setContent(e.target.value)} size={30} /></label>
        <div>작성자, 사용자 아이디, 비밀번호는 공통 입력 값을 씁니다</div>
      </ApiSection>

      {/* 본인 확인 */}
      <ApiSection
        title="checkOwner(id, userId, password)"
        request="POST /books/:id/verify  { userId, password } -> { ok }"
        onRun={() => checkOwner(bookId, userId, password)}
      />

      {/* 수정 */}
      <ApiSection
        title="updateBook(id, changes, credentials)"
        request="PATCH /books/:id  { title, content, userId, password, updatedAt }"
        onRun={() => updateBook(bookId, { title, content }, { userId, password })}
      >
        <div>위 등록 상자의 제목과 본문으로 수정합니다</div>
      </ApiSection>

      <ApiSection
        title="saveCover(id, dataUrl, credentials)"
        request="PATCH /books/:id  { coverImageUrl, userId, password, updatedAt }"
        onRun={() => saveCover(bookId, SAMPLE_COVER, { userId, password })}
      >
        <div>1x1 픽셀 시험용 이미지로 저장합니다</div>
      </ApiSection>

      {/* 삭제 */}
      <ApiSection
        title="deleteBook(id, credentials)"
        request="DELETE /books/:id  { userId, password }"
        onRun={async () => {
          if (!confirm(`${bookId}번 도서를 삭제할까요?`)) return '취소함';
          return deleteBook(bookId, { userId, password });
        }}
      />
    </main>
  );
}

export default BooksApiPlayground;
