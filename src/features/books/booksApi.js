// json-server 와 대화하는 모듈 입니다.
/** @import { Book, BookView, NewBookInput, BookChanges } from './types.js' */

// 서버 주소 : .env 의 VITE_API_URL, 없으면 로컬 json-server
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
// 응답이 이 시간 안에 안 오면 포기 (TimeoutError)
const TIMEOUT_MS = 5000;

/**
 * 공통 요청 도우미 : 시간 제한, res.ok 확인, JSON 변환을 담당합니다.
 * @param {string} path  `/books` 처럼 BASE_URL 뒤에 붙는 경로
 * @param {{ method?: string, body?: object }} [options]
 * @returns {Promise<any>}
 */
async function request(path, { method = 'GET', body } = {}) {
  // 요청 보내기 : body 가 있을 때만 JSON 헤더와 문자열 변환
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // 404, 500 같은 실패는 fetch 가 에러로 안 던지므로 직접 확인
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`, { cause: res.status });

  // 응답 본문을 객체로 (두 번째 await)
  return res.json();
}

/**
 * 비밀번호를 SHA-256 16진수 문자열로 바꿉니다 (데모용)
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  // 문자열 -> 바이트
  const bytes = new TextEncoder().encode(password);
  // 바이트 -> SHA-256 해시 (브라우저 내장 Web Crypto)
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  // 해시 바이트 -> 16진수 문자열 (예: "03ac67...")
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 화면에 넘기기 전에 passwordHash 를 뺍니다
 * @param {Book} book
 * @returns {BookView}
 */
function toBookView({ passwordHash, ...rest }) {
  // 구조 분해로 passwordHash 만 떼고 나머지만 돌려줌
  return rest;
}

/**
 * 도서 목록 (최신순). 검색어가 있으면 전체 필드에서 검색합니다
 * @param {string} [query]
 * @returns {Promise<BookView[]>}
 */
export async function getBooks(query = '') {
  // 검색어가 있으면 json-server 전체 검색 ?q= 를 붙임 (한글은 인코딩)
  const qs = query ? `&q=${encodeURIComponent(query)}` : '';

  // GET /books : 등록일 기준 최신순
  /** @type {Book[]} */
  const books = await request(`/books?_sort=createdAt&_order=desc${qs}`);

  // 화면용으로 변환
  return books.map(toBookView);
}

/**
 * 도서 한 권
 * @param {number} id
 * @returns {Promise<BookView>}
 */
export async function getBook(id) {
  // GET /books/:id (없으면 404 -> request 가 에러로 던짐)
  return toBookView(await request(`/books/${id}`));
}

/**
 * 새 도서 등록. 비밀번호는 해시해서 저장합니다
 * @param {NewBookInput} input
 * @returns {Promise<BookView>}
 */
export async function createBook({
  title, author, content, password,
  description = '', userId = null, coverImageUrl = null,
}) {
  // 등록일과 수정일은 같은 시각으로 시작
  const now = new Date().toISOString();

  // POST /books : id 는 json-server 가 붙여 줌
  const saved = await request('/books', {
    method: 'POST',
    body: {
      title,
      author,
      description,                                // 작품 소개 (없으면 빈 문자열)
      content,
      userId,                                     // 임시 사용자 아이디 (없으면 null)
      passwordHash: await hashPassword(password), // 평문은 저장하지 않음
      coverImageUrl,                              // 등록 때 만든 표지가 없으면 null
      createdAt: now,
      updatedAt: now,
    },
  });

  // 서버가 돌려준 저장본 (id 포함) 을 화면용으로
  return toBookView(saved);
}

/**
 * 사용자 아이디와 비밀번호가 맞는지 확인합니다 (데모 수준 : 해시가 GET 응답에 들어 있음)
 * @param {number} id
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function checkOwner(id, userId, password) {
  // 해시를 비교해야 하므로 toBookView 를 거치지 않은 원본을 받음
  /** @type {Book} */
  const raw = await request(`/books/${id}`);

  // 사용자 아이디와 비밀번호 해시가 모두 같아야 통과 (userId 가 null 인 도서는 항상 실패)
  return raw.userId === userId && raw.passwordHash === (await hashPassword(password));
}

/**
 * 바뀐 필드만 수정하고 updatedAt 을 갱신합니다
 * @param {number} id
 * @param {BookChanges} changes
 * @returns {Promise<BookView>}
 */
export async function updateBook(id, changes) {
  // PATCH /books/:id : 바뀐 필드 + 수정 시각만 보냄 (다른 필드를 덮어쓰지 않게)
  const saved = await request(`/books/${id}`, {
    method: 'PATCH',
    body: { ...changes, updatedAt: new Date().toISOString() },
  });

  // 수정된 도서 전체가 돌아옴
  return toBookView(saved);
}

/**
 * AI 가 만든 표지 (Data URL) 를 저장합니다
 * @param {number} id
 * @param {string} coverImageUrl  `data:image/png;base64,...`
 * @returns {Promise<BookView>}
 */
export async function saveCover(id, coverImageUrl) {
  // 표지 재생성도 같은 PATCH (coverImageUrl + updatedAt)
  return updateBook(id, { coverImageUrl });
}

/**
 * 도서 삭제
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteBook(id) {
  // DELETE /books/:id : 응답 본문은 빈 객체라 돌려줄 값 없음
  await request(`/books/${id}`, { method: 'DELETE' });
}
