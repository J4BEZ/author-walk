// json-server 와 대화하는 모듈 입니다.
/** @import { BookView, NewBookInput, BookChanges, BookQuery } from '../types.js' */
//
// 쓰기 (등록, 수정, 표지, 삭제) 는 로그인 토큰으로 누구인지 알립니다 (Authorization: Bearer)
// 화면이 아직 넘기는 아이디, 비밀번호 (credentials) 는 받지 않고 서버에도 보내지 않습니다
// -> 등록, 수정 폼에서 아이디, 비밀번호 칸을 빼도 아무 일도 일어나지 않음

import { createRequest } from '#src/api/client.js';
import { isImageDataUrl } from '#src/utils/validation/image.js';
import { queryBooks, toBookQuery } from '../utils/bookQuery.js';


// 책 요청 : 화면이 cause 로 알아보는 경우를 예전 모양으로 바꿔 던짐
// - 401, 403 : NOT_OWNER (BookCreate, BookDetail, BookEdit, Main, useSummaryBookCoverGenerator 가 확인하고 message 를 띄움)
//   401 은 원래 "로그인 필요" 라 NOT_OWNER 와 뜻이 다르지만, 페이지를 바꾸지 않고 알맞은 안내를 띄우려고 임시로 함께 씀
//   (등록, 수정 폼의 아이디, 비밀번호 칸을 정리할 때 페이지에서 401 과 403 을 나누기)
// - 404 : cause 가 숫자 404 (useBooks, BookLikeButton 이 확인)
const request = createRequest({
  401: () => new Error('로그인이 필요합니다.', { cause: 'NOT_OWNER' }),
  403: () => new Error('이 작품을 수정, 삭제할 권한이 없습니다.', { cause: 'NOT_OWNER' }),
  404: () => new Error('요청 실패 (404)', { cause: 404 }),
});


/**
 * 도서 목록 : 전체를 받아 화면에 보이는 필드로만 검색, 정렬, 기간, 개수 조건을 적용합니다
 * @param {string | BookQuery} [query]  목록 검색 조건(검색어(q), 검색 대상(field), 정렬(sort), 기간(days), 최대 개수(limit)) 혹은 "문자열"
 * @returns {Promise<BookView[]>}
 */
export async function getBooks(query = {}) {

  // GET /books : 전체 목록 (?q= 는 작품과 크게 관련 없는 숨은 필드(e.g. passwordHash 등)까지 검색해서 쓰지 않음)
  // (passwordHash 는 서버가 응답에서 빼고 보냄)
  /** @type {BookView[]} */
  const books = await request('/books');

  // 문자열이나 객체 형태의 query를 BookQuery 객체로 변환
  const bookQuery = toBookQuery(query);

  // BookQuery로 검색된 새로운 책 목록 반환
  return queryBooks(books, bookQuery);
}


/**
 * 도서 한 권
 * @param {number} id
 * @returns {Promise<BookView>}
 */
export async function getBook(id) {
  // GET /books/:id (없으면 404 -> request 가 에러로 던짐)
  return request(`/books/${id}`);
}

/**
 * @param {number} id
 * @returns {Promise<number>}
 */
export async function incrementBookLikes(id) {
  const { likes } = await request(`/books/${id}/likes`, { method: 'POST' });
  return likes;
}

/**
 * 새 도서 등록 : 주인은 서버가 토큰으로 정합니다 (로그인 필요, 아니면 NOT_OWNER 에러 '로그인이 필요합니다.')
 * input 에 userId, password 가 있어도 보내지 않습니다
 * @param {NewBookInput} input
 * @param {string | null} token  로그인 토큰 (useAuth 의 token)
 * @returns {Promise<BookView>}
 */
export async function createBook({
  title, author, content,
  description = '', coverImageUrl = null,
}, token) {
  // 등록일과 수정일은 같은 시각으로 시작
  const now = new Date().toISOString();

  // POST /books : id 는 json-server 가, 주인 (userId) 과 likes 는 서버가 붙여 줌
  const saved = await request('/books', {
    method: 'POST',
    token,
    body: {
      title,
      author,
      description,                                // 작품 소개 (없으면 빈 문자열)
      content,
      coverImageUrl,                              // 등록 때 만든 표지가 없으면 null
      createdAt: now,
      updatedAt: now,
    },
  });

  // 서버가 돌려준 저장본 (id, userId 포함, passwordHash 는 서버가 뺌)
  return saved;
}

/**
 * 바뀐 필드만 수정하고 updatedAt 을 갱신합니다    
 * (서버가 토큰으로 주인 확인, 아니면 NOT_OWNER 에러)
 * @param {number} id
 * @param {BookChanges} changes
 * @param {string | null} token  로그인 토큰
 * @returns {Promise<BookView>}
 */
export async function updateBook(id, changes, token) {
  // PATCH /books/:id : 바뀐 필드 + 수정 시각
  const saved = await request(`/books/${id}`, {
    method: 'PATCH',
    token,
    body: { ...changes, updatedAt: new Date().toISOString() },
  });

  // 수정된 도서 전체 (passwordHash 는 서버가 뺌)
  return saved;
}

/**
 * AI 가 만든 표지 (Data URL) 를 저장합니다 (주인만)
 * @param {number} id
 * @param {string} coverImageUrl  `data:image/png;base64,...`
 * @param {string | null} token  로그인 토큰
 * @returns {Promise<BookView>}
 */
export async function saveCover(id, coverImageUrl, token) {
  // 이미지 Data URL 이 아니면 서버에 보내지 않음
  if (!isImageDataUrl(coverImageUrl)) {
    throw new Error('표지 이미지 형식이 올바르지 않습니다', { cause: 'INVALID_IMAGE' });
  }
  // 표지 재생성도 같은 PATCH (coverImageUrl + updatedAt)
  return updateBook(id, { coverImageUrl }, token);
}

/**
 * 도서 삭제 (주인만)
 * @param {number} id
 * @param {string | null} token  로그인 토큰
 * @returns {Promise<void>}
 */
export async function deleteBook(id, token) {
  // DELETE /books/:id (응답 본문은 빈 객체)
  await request(`/books/${id}`, { method: 'DELETE', token });
}
