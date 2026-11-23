import {useNavigate, useLocation, Link} from "react-router-dom";
import {useBookList} from "../features/books/hooks/useBooks.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SearchBar from "../components/SearchBar.jsx";
import NewBooks from "../components/NewBooks.jsx";

import "../App.css";
import "../styles/font.css";

import {isBlank} from "#src/utils/validation/text.js";
import {queryBooks, NEW_BOOK_DAYS} from "../features/books/utils/bookQuery.js";

/** @import { BookView } from './features/books/types.js' */
//

/**
 * 에러를 alert 문구로 (본인 확인 실패는 그 메시지 그대로)
 * - 향후 정책상 브라우저 알림인 alert 대신, UI 내 알림 모달 또는 텍스트 필드 아래 빨간 설명으로 대체될 수 있습니다.
 * - 아래 함수는 임시로 만든 예시 처리 함수 입니다.
 * @param {unknown} e
 * @param {string} fallback
 */
function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

/**
 * 검사 결과의 error들을 하나로 합쳐서 반환합니다 (없으면 빈 문자열)
 *
 * - 향후 정책상 브라우저 알림인 alert 대신, UI 내 알림 모달 또는 텍스트 필드 아래 빨간 설명으로 대체될 수 있습니다.
 * - 아래 함수는 임시로 만든 예시 처리 함수 입니다.
 * @param {Record<string, string>} errors
 * @returns {string | null}
 */
function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

/**
 * 기본 보기 (이번 주 신작) 함수
 * @param {BookView[]} books
 * @returns {BookView[]}
 */
const defaultView = (books) => queryBooks(books, {days: NEW_BOOK_DAYS});

function Main() {
  const navigate = useNavigate();
  const booksState = useBookList();
  const location = useLocation();
  const isLoggedIn = location.pathname === "/logged-in";

  // 검색어가 없으면 기본 보기 (이번 주 신작), 있으면 검색 결과
  const shownBooks = isBlank(booksState.query.q)
    ? defaultView(booksState.books)
    : booksState.books;

  return (
    <>
      <Header isLoggedIn={isLoggedIn} />

      <main>
        {isLoggedIn ? (
          <section className="main-intro">
            <h1>안녕하세요, 주홍님</h1>
            <p>오늘은 어떤 이야기를 만들어 볼까요?</p>
          </section>
        ) : (
          <section className="main-intro">
            <h1>당신도 작가가 될 수 있어요</h1>
            <a>
              <Link to="/login">로그인하고 글쓰기 →</Link>
            </a>
          </section>
        )}
        <SearchBar onSearch={booksState.reload} />
        <NewBooks
          books={shownBooks}
          onSelect={(id) => navigate(`/books/${id}`)}
        />
      </main>
      <Footer />
    </>
  );
}

export default Main;
