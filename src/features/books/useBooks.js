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
// 규칙 : 컴포넌트 맨 위에서만 부르고 (if, 반복문 안 X), useBooks() 는 공통 부모에서 한 번만 부릅니다

import { useState, useEffect } from 'react';
import {
  getBooks, getBook, createBook, checkOwner, updateBook, saveCover, deleteBook, incrementBookLikes,
} from './booksApi.js';

/** @import { BookView, NewBookInput, BookChanges, Credentials } from './types.js' */

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
 * 본인 확인 : 사용자 아이디나 비밀번호가 다르면 에러를 던집니다
 * @param {number} id
 * @param {Credentials} credentials
 */
async function assertOwner(id, { userId, password }) {
  if (!(await checkOwner(id, userId, password))) {
    throw new Error('사용자 아이디 또는 비밀번호가 맞지 않습니다', { cause: 'NOT_OWNER' });
  }
}

/**
 * 도서 목록 화면용 훅 : 목록, 로딩, 에러와 등록, 수정, 삭제, 검색 함수를 돌려줍니다
 *
 * 등록, 수정, 삭제 함수는 성공하면 목록 State 까지 고치고, 실패하면 에러를 던집니다.
 * (화면에서는 try / catch 로 감싸 실패 문구를 보여 줍니다.)
 * 
 * @returns {{ books: BookView[], loading: boolean, error: string | null, reload: (query?: string) => Promise<void>, addBook: (input: NewBookInput) => Promise<BookView>, likeBook: (id: number) => Promise<void>, getBookLikes: (book: BookView) => number, likingIds: Set<number>, editBook: (id: number, changes: BookChanges, credentials: Credentials) => Promise<BookView>, changeCover: (id: number, dataUrl: string) => Promise<BookView>, removeBook: (id: number, credentials: Credentials) => Promise<void> }} 훅에서 제공하는 값들 (목록, 로딩, 에러 상태와 CRUD 함수)
 */
export function useBooks() {
  const [books, setBooks] = useState(/** @type {BookView[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [savedLikes, setSavedLikes] = useState(() => new Map(/** @type {[number, number][]} */ ([])));
  const [likingIds, setLikingIds] = useState(() => new Set(/** @type {number[]} */ ([])));

  // 처음 한 번 불러오기 (loading 은 처음부터 true 라 여기서 켤 필요 없음)
  useEffect(() => {
    let ignore = false; // StrictMode 로 두 번 돌 때 버려진 쪽 결과는 무시

    async function load() {
      try {
        const data = await getBooks();
        if (!ignore) setBooks(data);
      } catch (e) {
        console.error(e);
        if (!ignore) setError(toMessage(e, '도서 목록을 불러오지 못했어요'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();

    return () => {
      ignore = true;
    };
  }, []);

  /**
   * 목록 다시 불러오기 (검색 버튼, 새로고침 버튼에서 부름)
   * @param {string} [query]  검색어. 비우면 전체
   */
  const reload = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await getBooks(query));
    } catch (e) {
      console.error(e);
      setError(toMessage(e, '도서 목록을 불러오지 못했어요'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 등록 : 서버가 돌려준 저장본을 목록 맨 앞에 붙입니다
   * @param {NewBookInput} input
   * @returns {Promise<BookView>}
   */
  const addBook = async (input) => {
    const saved = await createBook(input);
    setBooks((prev) => [saved, ...prev]);
    return saved;
  };

  /** @param {number} id */
  const likeBook = async (id) => {
    if (likingIds.has(id)) return;
    setLikingIds((prev) => new Set(prev).add(id));
    try {
      const likes = await incrementBookLikes(id);
      setBooks((prev) => prev.map((book) => (book.id === id ? { ...book, likes } : book)));
      setSavedLikes((prev) => new Map(prev).set(id, likes));
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /** @param {BookView} book */
  const getBookLikes = (book) => Math.max(book.likes ?? 0, savedLikes.get(book.id) ?? 0);

  /**
   * 수정 : 본인 확인 -> PATCH -> 목록에서 그 도서만 바꿔 끼우기
   * @param {number} id
   * @param {BookChanges} changes
   * @param {Credentials} credentials
   * @returns {Promise<BookView>}
   */
  const editBook = async (id, changes, credentials) => {
    await assertOwner(id, credentials);
    const updated = await updateBook(id, changes);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  /**
   * 표지 저장 (생성, 재생성) : 목록에서 그 도서만 바꿔 끼우기
   * @param {number} id
   * @param {string} dataUrl  `data:image/png;base64,...`
   * @returns {Promise<BookView>}
   */
  const changeCover = async (id, dataUrl) => {
    const updated = await saveCover(id, dataUrl);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  /**
   * 삭제 : 본인 확인 -> DELETE -> 목록에서 빼기
   * @param {number} id
   * @param {Credentials} credentials
   * @returns {Promise<void>}
   */
  const removeBook = async (id, credentials) => {
    await assertOwner(id, credentials);
    await deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSavedLikes((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return { books, loading, error, reload, addBook, likeBook, getBookLikes, likingIds, editBook, changeCover, removeBook };
}

/**
 * 도서 한 권 화면용 훅 (상세, 수정 화면) : id 가 바뀌면 다시 불러옵니다
 * @param {number | null} id  아직 고른 도서가 없으면 null
 */
export function useBook(id) {
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
