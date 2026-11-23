// json-server 와 대화하는 모듈 입니다.
/** @import { BookView, NewBookInput, BookChanges, BookQuery, Credentials } from '../types.js' */

import { createRequest } from '#src/api/client.js';
import { isImageDataUrl } from '#src/utils/validation/image.js';
import { queryBooks, toBookQuery } from '../utils/bookQuery.js';


// 책 요청 : 화면이 cause 로 알아보는 두 경우를 예전 모양으로 바꿔 던짐
// - 403 : NOT_OWNER (BookCreate, BookDetail, BookEdit, Main, useSummaryBookCoverGenerator 가 확인)
// - 404 : cause 가 숫자 404 (useBooks, BookLikeButton 이 확인)
const request = createRequest({
  403: () => new Error('사용자 아이디 또는 비밀번호가 맞지 않습니다', { cause: 'NOT_OWNER' }),
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
 * 새 도서 등록. 비밀번호는 서버가 해시해서 저장합니다
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
      password,                                   // 서버가 직접 scrypt + salt 로 해시한 뒤 저장 (평문은 저장되지 않음)
      coverImageUrl,                              // 등록 때 만든 표지가 없으면 null
      likes: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 서버가 돌려준 저장본 (id 포함, passwordHash 는 서버가 뺌)
  return saved;
}

/**
 * 사용자 아이디와 비밀번호가 맞는지 서버에 확인합니다 (수정 화면을 열기 전 본인 확인 모달용)
 * @param {number} id
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function checkOwner(id, userId, password) {
  // POST /books/:id/verify : 서버가 저장된 해시와 비교해 { ok } 로 답함
  const { ok } = await request(`/books/${id}/verify`, {
    method: 'POST',
    body: { userId, password },
  });
  return ok;
}

/**
 * 바뀐 필드만 수정하고 updatedAt 을 갱신합니다 (서버가 본인 확인, 아니면 NOT_OWNER 에러)
 * @param {number} id
 * @param {BookChanges} changes
 * @param {Credentials} credentials
 * @returns {Promise<BookView>}
 */
export async function updateBook(id, changes, credentials) {
  // PATCH /books/:id : 바뀐 필드 + 수정 시각 + 본인 확인용 자격 정보 (서버가 확인 후 지우고 저장)
  const saved = await request(`/books/${id}`, {
    method: 'PATCH',
    body: { ...changes, ...credentials, updatedAt: new Date().toISOString() },
  });

  // 수정된 도서 전체 (passwordHash 는 서버가 뺌)
  return saved;
}

/**
 * AI 가 만든 표지 (Data URL) 를 저장합니다 (본인 확인 필요)
 * @param {number} id
 * @param {string} coverImageUrl  `data:image/png;base64,...`
 * @param {Credentials} credentials
 * @returns {Promise<BookView>}
 */
export async function saveCover(id, coverImageUrl, credentials) {
  // 이미지 Data URL 이 아니면 서버에 보내지 않음
  if (!isImageDataUrl(coverImageUrl)) {
    throw new Error('표지 이미지 형식이 올바르지 않습니다', { cause: 'INVALID_IMAGE' });
  }
  // 표지 재생성도 같은 PATCH (coverImageUrl + updatedAt)
  return updateBook(id, { coverImageUrl }, credentials);
}

/**
 * 도서 삭제 (본인 확인 필요)
 * @param {number} id
 * @param {Credentials} credentials
 * @returns {Promise<void>}
 */
export async function deleteBook(id, credentials) {
  // DELETE /books/:id : 본문에 자격 정보 (응답 본문은 빈 객체)
  await request(`/books/${id}`, { method: 'DELETE', body: credentials });
}
