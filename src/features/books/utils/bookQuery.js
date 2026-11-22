// 책 검색 관련 유틸리티


import { isBlank } from '#src/utils/validation/text.js'

/** @import { BookView, BookQuery } from '../types.js' */


const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 하루를 밀리초로 환산

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

// 띄어쓰기를 무시하고 비교할 필드 (짧은 필드만. 본문은 단어 경계를 넘는 오탐이 많아서 제외)
const SPACE_INSENSITIVE_FIELDS = ['title', 'author'];

/**
 * 비교용 문자열 : 소문자로, 필요하면 공백 제거
 * @param {unknown} value
 * @param {boolean} ignoreSpaces
 * @returns {string}
 */
function toComparable(value, ignoreSpaces) {
  
  // 문자열로 정규화 (null, undefined 는 빈 문자열)
  let str = String(value ?? '');

  // 소문자로 변환
  str = str.toLowerCase();
  
  // 공백 제거가 필요한 검색 분야만 공백 제거
  if (ignoreSpaces) {
    str = str.replace(/\s+/g, '');
  }
  return str;
}

/**
 * 책 필터링 : 주어진 조건만 차례로 적용합니다 (없는 조건은 건너뜀)
 * @param {BookView[]} books
 * @param {Pick<BookQuery, 'q' | 'field' | 'days'>} [query]
 * @param {number} [now]  기간 계산 기준 시각 (밀리초) 기본 값은 현재 시각.    [테스트용으로 고정된 값을 제공할 때 사용]
 * @returns {BookView[]}
 */
export function filterBooks(
  books, { q = '', field = 'titleAuthor', days } = {}, 
  now = Date.now()) {
  
  let result = books;
  
  // 검색어가 비어있지 않을 경우
  if (!isBlank(q)) {

    // 주어진 설정으로 검색할 필드와 키워드 결정
    const fields = SEARCH_FIELDS[field] ?? SEARCH_FIELDS.titleAuthor;
    const keyword = q.trim().toLowerCase();

    // 검색어가 포함된 책만 남김
    result = result.filter((book) =>
      fields.some((f) => {
        const ignoreSpaces = SPACE_INSENSITIVE_FIELDS.includes(f);
        return toComparable(book[f], ignoreSpaces)
        .includes(toComparable(keyword, ignoreSpaces));
      }),
    );
  }

  // 기간 조건 필터링
  if (days) {
    const since = now - (days * ONE_DAY_MS);
    result = result.filter((book) => Date.parse(book.createdAt) >= since);
  }

  return result;
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

/**
 * 검색, 기간, 정렬, 개수 조건을 한 번에 적용한 새로운 책 목록을 반환 합니다.
 * @param {BookView[]} books
 * @param {BookQuery} [query]
 * @param {number} [now]  기간 계산 기준 시각 (테스트용)
 * @returns {BookView[]}
 * @example
 * queryBooks(books, { q: '봄날' });                                // 제목+작가에서 '봄날', 최신순
 * queryBooks(books, { days: NEW_BOOK_DAYS, limit: 5 });            // 이번 주(NEW_BOOK_DAYS=7) 신작 5권
 * queryBooks(books, { q: '서점', field: 'titleContent' });         // 제목+내용에서 '서점'
 * queryBooks(books, { q: '홍길동', field: 'author', sort: 'oldest' }); // 홍길동 작가의 책, 오래된순
 * queryBooks(books, { sort: 'title' });                            // 전체를 제목순 (2권이 10권보다 앞)
 * queryBooks(books, { days: 30, sort: 'title' });                  // 최근 30일 책을 제목순
 * queryBooks(books, { limit: 3 });                                 // 최신 3권
 * queryBooks(books);                                               // 전체, 최신순 (조건 없으면 기본값)
 */
export function queryBooks(books, query = {}, now = Date.now()) {
  // 필터링 & 정렬 & 개수 제한 한번에 적용
  const sorted = sortBooks(filterBooks(books, query, now), query.sort);
  return query.limit ? sorted.slice(0, query.limit) : sorted;
}



/**
 * 문자열 검색어도 받을 수 있게 BookQuery 로 맞춥니다 (예전 호출 호환)
 * @param {string | BookQuery} [query]
 * @returns {BookQuery}
 * @example
 * toBookQuery('봄날');            // { q: '봄날' }
 * toBookQuery({ sort: 'title' }); // { sort: 'title' } 그대로
 * toBookQuery();                  // {}
 */
export function toBookQuery(query = {}) {

  // 문자열일 경우 {q: '검색어'} 형태로 변환
  const bookQuery = (typeof query === 'string') ? { q: query } : query;
 
  // bookQuery가 객체가 아니거나 null이면 빈 객체로 초기화, 그렇지 않으면 변환된 bookQuery 그대로 반환
  return (typeof bookQuery === 'object' && bookQuery !== null) ? bookQuery : {};
}


