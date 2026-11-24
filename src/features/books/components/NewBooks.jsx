import "#src/styles/NewBooks.css";
import BookLikeButton from "./BookLikeButton.jsx";
import CoverImage from "./CoverImage.jsx";

function NewBooks({books, onSelect, likes}) {
  const newBooks = [...books]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <section className="new-books">
      <div className="new-books-header">
        <div className="new-books-title">
          <h2>이번 주 신작</h2>
          <span className="new-books-badge">NEW</span>
        </div>
        <a href="/books">더 보러가기 →</a>
      </div>

      {newBooks.length === 0 ? (
        <p>등록된 작품이 없습니다.</p>
      ) : (
        <div className="new-books-list">
          {newBooks.map((book) => (
            <div key={book.id} className="new-book-item">
              <button
                type="button"
                className="new-book-card"
                onClick={() => onSelect(book.id)}>
                <div className="new-book-cover">
                  {/* 목록은 썸네일, 실패하면 원본, 그래도 없으면 "표지 없음" */}
                  <CoverImage
                    sources={[book.coverThumbnailUrl, book.coverImageUrl]}
                    alt={book.title}
                    loading="lazy"
                    fallback={<span>표지 없음</span>}
                  />
                </div>
              </button>

              <div className="new-book-bottom">
                <button
                  type="button"
                  className="new-book-info"
                  onClick={() => onSelect(book.id)}>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <span className="new-book-date">
                    {book.createdAt?.slice(0, 10)}
                  </span>
                </button>

                <div className="new-book-like">
                  <BookLikeButton book={book} likes={likes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NewBooks;
