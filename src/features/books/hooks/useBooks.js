// 도서 State 와 booksApi 를 잇는 커스텀 훅 예시
//
// 훅 : useState, useEffect 처럼 이름이 use 로 시작하는 함수입니다.
//      커스텀 훅은 그 훅들을 묶어 "State + 불러오기 + 바꾸기" 를 한 함수로 만든 것입니다.
//
// 나눈 이유
// - 화면 컴포넌트는 받은 값으로 그리기만 하면 됩니다 (fetch, 로딩, 에러 처리를 몰라도 됨)
// - 같은 로직을 목록, 메인, 상세 화면이 함께 씁니다 (복사해 붙이지 않음)
// - 서버가 바뀌어도 (5차 Spring Boot) 화면 코드는 그대로입니다
//
// 규칙 : 컴포넌트 맨 위에서만 부르고 (if, 반복문 안 X), useBookList() 는 공통 부모 (App) 에서 한 번만 부릅니다
//        검색, 정렬은 각 페이지가 queryBooks 로 계산합니다 (훅은 전체 목록만 들고 있음)

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getBooks, getBook, createBook, updateBook, saveCover, deleteBook, incrementBookLikes,
} from '../api/booksApi.js';

/** @import { BookView, NewBookInput, BookChanges, Credentials } from '../types.js' */

export const BookLikesContext = createContext(
  /** @type {ReturnType<typeof useBookLikesState> | null} */ (null),
);

export function useBookLikes() {
  const likes = useContext(BookLikesContext);
  if (!likes) throw new Error('BookLikesProvider가 필요합니다');
  return likes;
}

export function useBookLikesState() {
  const [savedLikes, setSavedLikes] = useState(() => new Map(/** @type {[number, number][]} */ ([])));
  const [likingIds, setLikingIds] = useState(() => new Set(/** @type {number[]} */ ([])));
  const pendingLikes = useRef(new Set(/** @type {number[]} */ ([])));

  /** @param {number} id */
  const likeBook = async (id) => {
    // 페이지를 이동하거나 다시 렌더링되기 전에도 같은 도서의 요청은 하나만 보냅니다.
    const pending = pendingLikes.current;
    if (pending.has(id)) return;
    pending.add(id);
    setLikingIds(new Set(pending));
    try {
      const likes = await incrementBookLikes(id);
      if (!Number.isSafeInteger(likes) || likes < 0) {
        throw new Error('서버가 올바른 좋아요 수를 반환하지 않았어요');
      }
      setSavedLikes((prev) => new Map(prev).set(id, likes));
    } finally {
      pending.delete(id);
      setLikingIds(new Set(pending));
    }
  };

  /** @param {BookView} book */
  const getBookLikes = (book) => Math.max(book.likes ?? 0, savedLikes.get(book.id) ?? 0);

  /** @param {number} id */
  const clearBookLikes = (id) => {
    setSavedLikes((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return { likeBook, getBookLikes, likingIds, clearBookLikes };
}

/**
 * 에러를 화면에 보여 줄 문구로 바꿉니다
 * @param {unknown} e
 * @param {string} fallback  그 밖의 실패일 때 문구
 * @returns {string}
 */
function toMessage(e, fallback) {
  if (e instanceof Error && e.name === 'TimeoutError') return '서버 응답이 느려요';
  if (e instanceof Error && e.cause === 404) return '도서를 찾을 수 없어요';
  return fallback;
}


/**
 * 전체 도서 목록 훅 : 전체 목록, 로딩, 에러와 등록, 수정, 표지 저장, 삭제, 새로고침 함수를 반환합니다
 *
 * App 에서 한 번만 부르고 페이지에는 props 로 내려 줍니다.
 * 등록, 수정, 삭제 함수는 성공하면 목록 State 까지 고치고, 실패하면 에러를 던집니다.
 * (화면에서는 try / catch 로 감싸 실패 문구를 보여 줍니다.)
 *
 * @returns 훅에서 제공하는 값들 (전체 목록, 로딩, 에러 상태와 CRUD 함수)
 */
export function useBookList() {
  const [books, setBooks] = useState(/** @type {BookView[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const likes = useContext(BookLikesContext);
  
  // useRef : 값이 바뀌어도 화면을 다시 그리지 않는 상자 (.current 로 읽고 씀)
  // 비동기 함수 안에서도 항상 최신 값이 보여서, 번호표처럼 화면에 안 보이는 값에 씁니다

  const latestRequest = useRef(0); // 마지막으로 보낸 요청의 번호 (응답 순서가 뒤바뀌는 경우 무시하기 위함)


  // 처음 한 번 불러오기 (loading 은 처음부터 true 라 여기서 켤 필요 없음)
  useEffect(() => {
    let ignore = false; // StrictMode 로 두 번 돌 때 버려진 쪽 결과는 무시

    // 마지막으로 보낸 요청과 호출하는 타이밍에서 일치하는지 확인하는 함수
    const requestId = ++latestRequest.current; // 요청 번호 증가 시킨 이후 기록
    const isLatest = () => { return requestId === latestRequest.current; };

    // 처음 불러오는 결과가 늦게 도착해서
    // 새로고침 결과를 덮어써버리지 않도록 isLatest() 체크도 함께 진행
    async function load() {
      try {
        const data = await getBooks();
        if (!ignore && isLatest()) setBooks(data);
      } catch (e) {
        console.error(e);
        if (!ignore && isLatest()) setError(toMessage(e, '도서 목록을 불러오지 못했어요'));
      } finally {
        if (!ignore && isLatest()) setLoading(false);
      }
    }
    load();

    return () => {
      ignore = true;
    };
  }, []);

  /**
  * 전체 목록 다시 불러오기 (새로고침 버튼 등에서 부름)
  * 검색은 다시 불러오지 않고 각 페이지에서 queryBooks(books, 조건) 으로 계산합니다
  * @returns {Promise<void>}
  */
  const reload = async () => {

    // 요청 번호 증가 시킨 이후 기록
    const requestId = ++latestRequest.current;
    // 마지막으로 보낸 요청과 호출하는 타이밍에서 일치하는지 확인하는 함수
    const isLatest = () => { return requestId === latestRequest.current; };

    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();

      // 마지막으로 보낸 요청과 일치할 때만 상태 갱신
      // (늦게 도착한 이전 응답이 화면에 뿌려지는 경쟁상태 방지를 위함입니다.)
      if (isLatest()) {
        setBooks(data);
      }
      
    } catch (e) {
      // 마지막으로 보낸 요청과 일치할 때만 에러 상태 갱신
      if (isLatest()) {
        console.error(e);
        setError(toMessage(e, '도서 목록을 불러오지 못했어요'));
      }
    } finally {
      // 마지막으로 보낸 요청과 일치할 때만 로딩 상태 갱신
      if (isLatest()) {
        setLoading(false);
      }
    }
  };

  /**
   * 등록 : 서버가 돌려준 저장본을 목록 맨 앞에 붙입니다
   * @param {NewBookInput} input
   * @returns {Promise<BookView>}
   */
  const addBook = async (input) => {
    const saved = await createBook(input);

    // 훅의 목록은 항상 전체라, 새 책을 맨 앞에 붙인 새 배열로 교체 (불변성 : 펼쳐서 복사)
    setBooks((prev) => [saved, ...prev]);
    return saved;
  };

  /**
   * 수정 : PATCH (서버가 본인 확인) -> 목록에서 그 도서만 바꿔 끼우기
   * @param {number} id
   * @param {BookChanges} changes
   * @param {Credentials} credentials
   * @returns {Promise<BookView>}
   */
  const editBook = async (id, changes, credentials) => {
    const updated = await updateBook(id, changes, credentials);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  /**
   * 표지 저장 (생성, 재생성) : 서버가 본인 확인 -> 목록에서 그 도서만 바꿔 끼우기
   * @param {number} id
   * @param {string} dataUrl  `data:image/png;base64,...`
   * @param {Credentials} credentials
   * @returns {Promise<BookView>}
   */
  const changeCover = async (id, dataUrl, credentials) => {
    const updated = await saveCover(id, dataUrl, credentials);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  /**
   * 삭제 : DELETE (서버가 본인 확인) -> 목록에서 빼기
   * @param {number} id
   * @param {Credentials} credentials
   * @returns {Promise<void>}
   */
  const removeBook = async (id, credentials) => {
    await deleteBook(id, credentials);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    likes?.clearBookLikes(id);
  };

  return { books, loading, error, reload, addBook, editBook, changeCover, removeBook };
}

/**
 * 도서 한 권 화면용 훅 (상세, 수정 화면) : id 가 바뀌면 다시 불러옵니다
 * @param {number | null} id  아직 고른 도서가 없으면 null
 */
export function useBookDetail(id) {
  const [book, setBook] = useState(/** @type {BookView | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (id === null) return;
    let ignore = false; // id 가 빨리 바뀌면 늦게 온 이전 응답은 버리기

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const found = await getBook(/** @type {number} */ (id));
        if (!ignore) setBook(found);
      } catch (e) {
        console.error(e);
        if (!ignore) setError(toMessage(e, '도서를 불러오지 못했어요'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();

    return () => {
      ignore = true;
    };
  }, [id]);

  // setBook 도 돌려줘서, 수정이나 표지 저장 후 받은 값으로 바로 바꿀 수 있게
  return { book, loading, error, setBook };
}


// 옛 경로 (다음 정리 때 삭제 예정)
/** @deprecated useBookList 를 써 주세요 */
export const useBooks = useBookList;

/** @deprecated useBookDetail 을 써 주세요 */
export const useBook = useBookDetail;
