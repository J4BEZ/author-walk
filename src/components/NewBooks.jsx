import "../styles/NewBooks.css";
import BookLikeButton from "./BookLikeButton.jsx";

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
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} />
                  ) : (
                    <span>표지 없음</span>
                  )}
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
