import {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {useBookLikes} from "../features/books/hooks/useBooks.js";
import {useAuth} from "../features/auth/hooks/useAuth.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SearchBar from "../components/SearchBar.jsx";
import NewBooks from "../features/books/components/NewBooks.jsx";

import "../App.css";
import "../styles/font.css";

import {isBlank} from "#src/utils/validation/text.js";
import {queryBooks, NEW_BOOK_DAYS} from "../features/books/utils/bookQuery.js";

/** @import { BookListState } from '../features/books/hooks/useBooks.js' */
/** @import { BookView } from '../features/books/types.js' */

/**
 * 기본 보기 (이번 주 신작) 함수
 * @param {BookView[]} books
 * @returns {BookView[]}
 */
const defaultView = (books) => queryBooks(books, {days: NEW_BOOK_DAYS});

/**
 * 메인 페이지
 * @param {{ booksState: BookListState }} props
 */
function Main({booksState}) {
  const navigate = useNavigate();
  const likes = useBookLikes();
  // 로그인 여부는 주소가 아니라 useAuth 의 user 로 판단 (Header 와 같은 기준)
  const {user, checking} = useAuth();

  // 이 페이지의 검색어 (다른 페이지의 검색과 서로 영향을 주지 않도록 페이지마다 따로 둠)
  const [keyword, setKeyword] = useState("");

  // 검색어가 없으면 기본 보기 (이번 주 신작), 있으면 전체 목록에서 검색한 결과
  const shownBooks = isBlank(keyword)
    ? defaultView(booksState.books)
    : queryBooks(booksState.books, {q: keyword});

  return (
    <>
      <Header />

      <main>
        {/* 확인 중 (새로고침 직후 저장된 토큰을 서버에 묻는 동안) 에는 인사 영역을 그리지 않음 */}
        {checking ? null : user ? (
          <section className="main-intro">
            <h1>안녕하세요, {user.userId}님</h1>
            <p>오늘은 어떤 이야기를 만들어 볼까요?</p>
          </section>
        ) : (
          <section className="main-intro">
            <h1>당신도 작가가 될 수 있어요</h1>
            <Link to="/login">로그인하고 글쓰기 →</Link>
          </section>
        )}
        <SearchBar onSearch={setKeyword} />
        <NewBooks
          books={shownBooks}
          onSelect={(id) => navigate(`/books/${id}`)}
          likes={likes}
        />
      </main>
      <Footer />
    </>
  );
}

export default Main;
