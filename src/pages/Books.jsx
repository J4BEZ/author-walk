import {useState} from "react";
import {useNavigate} from "react-router-dom";

import {useBookList, useBookLikes} from "../features/books/hooks/useBooks.js";
import {queryBooks} from "../features/books/utils/bookQuery.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SearchBar from "../components/SearchBar.jsx";
import BookLikeButton from "../components/BookLikeButton.jsx";

import "../App.css";
import "../styles/font.css";
import "../styles/Books.css";

function Books() {
  const navigate = useNavigate();
  const {books, loading, error} = useBookList();
  const likes = useBookLikes();

  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // 검색 + 정렬 : 제목, 작가에서 검색 (띄어쓰기 무시) 후 sortBy 순서로 (bookQuery.js)
  const filteredBooks = queryBooks(books, {q: keyword, sort: sortBy});

  return (
    <>
      <Header isLoggedIn={true} />

      <main className="books-page">
        <h1>전체 작품</h1>

        <SearchBar onSearch={setKeyword} />

        <div className="books-toolbar">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">최신 등록순</option>
            <option value="title">이름순</option>
          </select>
        </div>

        {loading ? (
          <p>작품을 불러오는 중입니다.</p>
        ) : error ? (
          <p>작품을 불러오지 못했습니다: {String(error)}</p>
        ) : filteredBooks.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          <div className="books-grid">
            {filteredBooks.map((book) => (
              <article className="books-card" key={book.id}>
                <button
                  type="button"
                  className="new-book-card"
                  onClick={() => navigate(`/books/${book.id}`)}>
                  <div className="books-cover">
                    {book.coverImageUrl ? (
                      <img src={book.coverImageUrl} alt={`${book.title} 표지`} />
                    ) : (
                      <span>표지 없음</span>
                    )}
                  </div>

                  <div className="books-info">
                    <h2>{book.title}</h2>
                    <p>{book.author}</p>

                    {book.description && (
                      <p className="books-description">{book.description}</p>
                    )}

                    <span className="books-date">
                      {book.createdAt?.slice(0, 10)}
                    </span>
                  </div>
                </button>
                <BookLikeButton book={book} likes={likes} />
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

export default Books;
