import {useParams, useNavigate} from "react-router-dom";
import {useBookDetail, useBookLikes} from "../features/books/hooks/useBooks.js";
import {useAuth} from "../features/auth/hooks/useAuth.js";
import {canModifyBook} from "#src/utils/roles.js";
import {toApiUrl} from "#src/api/client.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BookLikeButton from "../features/books/components/BookLikeButton.jsx";
import BookContentPager from "../features/books/components/BookContentPager.jsx";

/** @import { BookListState } from '../features/books/hooks/useBooks.js' */

import "../styles/BookDetail.css";

function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

/**
 * 작품 상세 페이지 : 한 권은 useBookDetail 로 불러오고, 삭제는 App 의 목록 훅 함수를 받아 씁니다
 * (그래야 삭제 결과가 목록 페이지에 바로 반영됨). 수정, 표지 변경은 수정 페이지 (/books/:id/edit) 에서
 * @param {{ removeBook: BookListState['removeBook'] }} props
 */
function BookDetail({removeBook}) {
  const {id} = useParams();
  const navigate = useNavigate();
  const likes = useBookLikes();

  const {book, loading, error} = useBookDetail(Number(id));
  const {user} = useAuth();

  if (loading || (!book && !error)) {
    return <p>작품을 불러오는 중입니다.</p>;
  }

  if (error || !book) {
    return <p>{error || "작품을 찾을 수 없습니다."}</p>;
  }

  // 수정, 삭제 버튼은 관리자이거나 책 주인일 때만 (서버 requireOwner 와 같은 함수, 실제 막는 건 서버)
  const canModify = canModifyBook(user, book);

  // 작품 삭제
  const handleDelete = async () => {
    if (!confirm(`"${book.title}"을(를) 삭제할까요?`)) return;

    try {
      await removeBook(book.id);
      navigate("/main");
    } catch (e) {
      alertError(e, "삭제에 실패했어요");
    }
  };

  return (
    <>
      <Header />

      <main className="book-detail-page">
        <div className="book-detail-layout">
          {/* 왼쪽: 책 표지 */}
          <section className="book-detail-left">
            <div className="book-detail-cover">
              {book.coverImageUrl ? (
                <img src={toApiUrl(book.coverImageUrl)} alt={`${book.title} 표지`} />
              ) : (
                <div className="book-detail-no-cover">표지 없음</div>
              )}
            </div>

            {canModify && (
              <div className="book-detail-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/books/${id}/edit`)}>
                  수정
                </button>

                <button type="button" onClick={handleDelete}>
                  삭제
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
                <BookLikeButton book={book} likes={likes} />
              </div>
            </div>

            <div className="book-detail-section">
              <h2>작품 소개</h2>
              <p>{book.description || "작품 소개가 없습니다."}</p>
            </div>

            <div className="book-detail-section">
              <h2>작품 내용</h2>
              <BookContentPager key={book.id} content={book.content} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BookDetail;
