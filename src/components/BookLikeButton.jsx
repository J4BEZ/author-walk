/** @import { BookView } from '../features/books/types.js' */

/** @param {{ book: BookView, likes: ReturnType<typeof import('../features/books/hooks/useBooks.js').useBookList>['likes'] }} props */
function BookLikeButton({book, likes}) {
  const count = likes.getBookLikes(book);

  const handleClick = async () => {
    try {
      await likes.likeBook(book.id);
    } catch (error) {
      console.error(error);
      alert("좋아요를 저장하지 못했어요");
    }
  };

  return (
    <button
      type="button"
      disabled={likes.likingIds.has(book.id)}
      onClick={handleClick}
      aria-label={`${book.title} 좋아요 ${count}개`}
    >
      ♡ {count}
    </button>
  );
}

export default BookLikeButton;
