/** @import { BookView } from '../features/books/types.js' */

/** @param {{ book: BookView, likes: ReturnType<typeof import('../features/books/hooks/useBooks.js').useBookList>['likes'] }} props */
function BookLikeButton({book, likes}) {
  const count = likes.getBookLikes(book);

  const handleClick = async () => {
    try {
      await likes.likeBook(book.id);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.name === "TimeoutError") {
        alert("서버 응답 시간이 초과됐어요. 새로고침해서 좋아요 수를 확인해 주세요.");
      } else if (error instanceof TypeError) {
        alert("서버에 연결할 수 없어요. 연결을 확인한 뒤 새로고침해 주세요.");
      } else if (error instanceof Error && error.cause === 404) {
        alert("도서나 좋아요 요청 경로를 찾을 수 없어요. 새로고침해 주세요.");
      } else {
        alert("좋아요를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    }
  };

  return (
    <button
      type="button"
      disabled={likes.likingIds.has(book.id)}
      onClick={handleClick}
      aria-label={`${book.title} 좋아요 ${count}개`}
    >
      {count} ♡
    </button>
  );
}

export default BookLikeButton;
