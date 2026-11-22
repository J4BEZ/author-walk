// 책 검색 관련 유틸리티


import { isBlank } from '#src/utils/validation/text.js'

/** @import { BookView } from '../types.js' */

/**
 * 제목 정렬용 Collator
 */
const titleCollator = new Intl.Collator('ko', { numeric: true });
// titleCollator.compare(a, b) 가 음수, 0, 양수를 반환

 /**
  *  검색 필드 종류
  * 
  * 'title' - 책 제목
  * 'titleContent' - 책 제목 및 내용
  * 'author' - 책 저자
  * 'titleAuthor' - 책 제목 및 저자
  */
export const SEARCH_FIELDS = {
  title: ['title'],
  titleContent: ['title', 'content'],
  author: ['author'],
  titleAuthor: ['title', 'author']
};

/**
 * 정렬 종류
 * 
 * 'latest' - 등록최신순
 * 'oldest' - 등록오래된순
 * 'title' - 제목순
 */
export const SORT_ORDERS = {
  // Date.parse를 사용하여 UTC 기준으로 비교
  // 큰 쪽(나중에 등록된 책)이 앞에 오도록 정렬
  latest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),

  // 작은 쪽(먼저 등록된 책)이 앞에 오도록 정렬
  oldest: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),

  // 제목순은 한글 기준으로 정렬
  title:  (a, b) => titleCollator.compare(a.title, b.title),
};

// '이번 주 신작' 기준일 수
export const NEW_BOOK_DAYS = 7;


/**
 * 책 필터링
 * @param {BookView[]} books - 책 목록
 * @param {Object} options - 필터 옵션
 * @param {string} options.q - 검색어
 * @param {string} options.field - 검색 필드
 * @returns {BookView[]} 필터링된 책 목록
 */
export function filterBooks(books, { q = '', field = 'titleAuthor' } = {}) {
  
  // 빈 검색어면 그대로 반환 (전체 작품 리스트)
  if (isBlank(q)) return books;

  // 검색할 필드 설정 (기본으로 '제목과 저자' 검색)
  const fields = SEARCH_FIELDS[field] ?? SEARCH_FIELDS.titleAuthor;

  // 검색할 키워드 정제 (영문의 경우 대소문자 모두 검색되도록 lower로 통일)
  const keyword = q.trim().toLowerCase();
  
  // 책 별로 검색어 포함 여부 확인
  return books.filter((book) =>
    // 필드 중 하나라도 검색어를 포함하면 통과
    fields.some((f) => book[f]?.toString().toLowerCase().includes(keyword)),
  );
}

/**
 * 책 정렬 (원본은 그대로 두고 정렬된 복사본을 반환)
 * @param {BookView[]} books - 책 목록
 * @param {keyof typeof SORT_ORDERS} [sort] - 정렬 종류 ('latest' | 'oldest' | 'title')
 * @returns {BookView[]} 정렬된 책 목록
 */
export function sortBooks(books, sort = 'latest') {
  
  // 정렬 함수 선택 (맵에 없는 값이면 latest)
  const sortFn = SORT_ORDERS[sort] ?? SORT_ORDERS.latest;

  // 복사본을 정렬해서 반환
  return [...books].sort(sortFn);
}

