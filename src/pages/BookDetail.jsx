import {useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useBookList, useBookDetail} from "../features/books/hooks/useBooks.js";
import {
  normalizeBookInput,
  validateBookChanges,
} from "../features/books/utils/bookValidation.js";
import BookCoverGenerator from "../features/OpenAI_Integration/BookCoverGenerator.jsx";

/**
 * 에러 메시지 표시
 */
function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

/**
 * 유효성 검사 에러 합치기
 */
function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

/**
 * 작품 상세 페이지
 */
function BookDetail() {
  const {id} = useParams();
  const navigate = useNavigate();
  const booksState = useBookList();

  const {book, loading, error, setBook} = useBookDetail(Number(id));

  const editBook = booksState.editBook;
  const changeCover = booksState.changeCover;
  const removeBook = booksState.removeBook;

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [newTitle, setNewTitle] = useState("");

  if (loading || (!book && !error)) {
    return (
      <section>
        <h2>상세 화면</h2>
        <p>불러오는 중입니다.</p>
      </section>
    );
  }

  if (error || !book) {
    return (
      <section>
        <h2>상세 화면</h2>
        <p>{error || "작품을 찾을 수 없습니다."}</p>
      </section>
    );
  }

  const credentials = {userId, password};

  // 작품 수정
  const handleEdit = async () => {
    const clean = normalizeBookInput({title: newTitle});
    const message = joinErrors(validateBookChanges(clean));

    if (message) {
      alert(message);
      return;
    }

    try {
      const updated = await editBook(book.id, clean, credentials);
      setBook(updated);
      setNewTitle("");
    } catch (e) {
      alertError(e, "수정에 실패했어요");
    }
  };

  // AI 표지 저장
  const handleCover = async (dataUrl) => {
    try {
      const updated = await changeCover(book.id, dataUrl, credentials);
      setBook(updated);
    } catch (e) {
      alertError(e, "표지 저장에 실패했어요");
    }
  };

  // 작품 삭제
  const handleDelete = async () => {
    if (!confirm(`"${book.title}"을(를) 삭제할까요?`)) return;

    try {
      await removeBook(book.id, credentials);
      navigate("/main");
    } catch (e) {
      alertError(e, "삭제에 실패했어요");
    }
  };

  return (
    <section className="book-detail">
      <h2>작품 상세</h2>

      {book.coverImageUrl && (
        <img src={book.coverImageUrl} alt={`${book.title} 표지`} width={160} />
      )}

      <h3>{book.title}</h3>
      <p>작성자: {book.author}</p>

      {book.description && <p>{book.description}</p>}

      <p>{book.content}</p>

      <p>등록일: {book.createdAt?.slice(0, 10)}</p>
      <p>수정일: {book.updatedAt?.slice(0, 10)}</p>

      <h3>본인 확인</h3>

      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="사용자 아이디"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />

      <h3>작품 수정</h3>

      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="새 제목"
      />

      <button onClick={handleEdit}>제목 수정</button>
      <button onClick={handleDelete}>삭제</button>

      <BookCoverGenerator
        key={JSON.stringify([book.id, book.title, book.author, book.content])}
        book={book}
        onSave={handleCover}
      />
    </section>
  );
}

export default BookDetail;
