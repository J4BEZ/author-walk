import {useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useBookList, useBookDetail} from "../features/books/hooks/useBooks.js";

import {
  normalizeBookInput,
  validateBookChanges,
} from "../features/books/utils/bookValidation.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

import "../styles/BookDetail.css";

function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

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
  const [isEditing, setIsEditing] = useState(false);

  if (loading || (!book && !error)) {
    return <p>작품을 불러오는 중입니다.</p>;
  }

  if (error || !book) {
    return <p>{error || "작품을 찾을 수 없습니다."}</p>;
  }

  const credentials = {userId, password};

  // 수정 버튼 클릭
  const openEdit = () => {
    setNewTitle(book.title);
    setIsEditing(true);
  };

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
      setIsEditing(false);
      alert("작품이 수정되었습니다.");
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
    <>
      <Header isLoggedIn={true} />

      <main className="book-detail-page">
        <div className="book-detail-layout">
          {/* 왼쪽: 책 표지 */}
          <section className="book-detail-left">
            <div className="book-detail-cover">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={`${book.title} 표지`} />
              ) : (
                <div className="book-detail-no-cover">표지 없음</div>
              )}
            </div>

            <p className="book-detail-notice">
              수정 및 삭제 시 등록한 비밀번호가 필요합니다.
            </p>

            <div className="book-detail-actions">
              <button
                type="button"
                onClick={() => navigate(`/books/${id}/edit`)}>
                수정하기
              </button>

              <button type="button" onClick={handleDelete}>
                삭제
              </button>
            </div>

            {/* 본인 확인 */}
            <div className="book-detail-auth">
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
            </div>

            {/* 제목 수정 */}
            {isEditing && (
              <div className="book-detail-edit">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="새 제목"
                />

                <button type="button" onClick={handleEdit}>
                  수정 완료
                </button>

                <button type="button" onClick={() => setIsEditing(false)}>
                  취소
                </button>
              </div>
            )}
          </section>

          {/* 오른쪽: 작품 상세 정보 */}
          <section className="book-detail-right">
            <div className="book-detail-top">
              <div className="book-detail-meta">
                <h1>{book.title}</h1>
                <p>{book.author}</p>
                <p>{book.createdAt?.slice(0, 10)} 등록</p>
                <p>{book.updatedAt?.slice(0, 10)} 수정</p>
              </div>

              <div className="book-detail-reactions">
                <span>구독 +</span>
                <span>♡ {book.likes ?? 0}</span>
              </div>
            </div>

            <div className="book-detail-section">
              <h2>작품 소개</h2>
              <p>{book.description || "작품 소개가 없습니다."}</p>
            </div>

            <div className="book-detail-section">
              <h2>작품 내용</h2>
              <p>{book.content}</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BookDetail;
