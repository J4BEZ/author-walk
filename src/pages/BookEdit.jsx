import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BookCoverGenerator from "../features/OpenAI_Integration/components/BookCoverGenerator.jsx";
import BookAnalysis from "../features/OpenAI_Integration/components/BookAnalysis.jsx";
import {useBookDetail} from "../features/books/hooks/useBooks.js";

import {
  EDITABLE_FIELDS,
  normalizeBookInput,
  validateBookChanges,
} from "../features/books/utils/bookValidation.js";
import {countChars} from "#src/utils/validation/text.js";

/** @import { BookListState } from '../features/books/hooks/useBooks.js' */

import "../styles/BookCreate.css";

function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

/**
 * 작품 수정 페이지 : 기존 값을 useBookDetail 로 불러온 뒤 수정 폼을 보여 줍니다
 * @param {{ editBook: BookListState['editBook'] }} props
 */
function BookEdit({editBook}) {
  const {id} = useParams();

  // 기존 작품 불러오기 (주소, 타임아웃, 404 문구는 booksApi 와 훅이 처리)
  const {book, loading, error} = useBookDetail(Number(id));

  if (loading || (!book && !error)) {
    return (
      <>
        <Header />
        <main className="book-create-page">
          <p>작품 정보를 불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Header />
        <main className="book-create-page">
          <p>{error || "작품을 찾을 수 없습니다."}</p>
        </main>
        <Footer />
      </>
    );
  }

  // key : 다른 작품으로 이동하면 폼을 새로 만들어 그 작품 값으로 다시 채움
  return <BookEditForm key={book.id} book={book} editBook={editBook} />;
}

/**
 * 수정 폼 : 불러온 작품으로 처음부터 채운 상태로 시작하고, 저장은 editBook 으로 바뀐 필드만 보냅니다
 * (Effect 로 나중에 채우지 않고 useState 초기값으로 채워, 빈 폼이 잠깐 보이거나 렌더링이 한 번 더 일어나지 않게)
 * @param {{
 *   book: import('../features/books/types.js').BookView,
 *   editBook: BookListState['editBook'],
 * }} props
 */
function BookEditForm({book, editBook}) {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    title: book.title ?? "",
    author: book.author ?? "",
    userId: book.userId ?? "",
    description: book.description ?? "",
    content: book.content ?? "",
    password: "",
  }));

  const [coverImageUrl, setCoverImageUrl] = useState(book.coverImageUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // AI 생성 표지를 임시로 적용
  const handleSaveCover = async (dataUrl) => {
    setCoverImageUrl(dataUrl);
  };

  // 작품 수정
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    const clean = normalizeBookInput(form);

    // 불러온 원본과 비교해 바뀐 필드만 고르기 (PATCH 는 바뀐 필드만 보냄)
    /** @type {import('../features/books/types.js').BookChanges} */
    const changes = {};
    for (const field of EDITABLE_FIELDS) {
      if (clean[field] !== (book[field] ?? "")) changes[field] = clean[field];
    }
    if (coverImageUrl !== (book.coverImageUrl ?? "")) changes.coverImageUrl = coverImageUrl;

    if (Object.keys(changes).length === 0) {
      alert("바뀐 내용이 없습니다.");
      return;
    }

    // 바뀐 필드만 검사
    const message = joinErrors(validateBookChanges(changes));

    if (message) {
      alert(message);
      return;
    }

    setSubmitting(true);

    try {
      // 서버에서 아이디와 비밀번호를 확인한 후 수정 (성공하면 App 의 목록에도 반영)
      await editBook(book.id, changes, {
        userId: clean.userId,
        password: clean.password,
      });

      alert("작품이 수정되었습니다.");
      navigate(`/books/${book.id}`);
    } catch (e) {
      console.error(e);

      if (e instanceof Error && e.cause === "NOT_OWNER") {
        alert(e.message);
      } else {
        alert("작품 수정에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const aiBook = {
    id: book.id,
    title: form.title,
    author: form.author,
    content: form.content,
  };

  return (
    <>
      <Header />

      <main className="book-create-page">
        <div className="book-create-layout">
          <section className="book-create-left">
            <h1>작품 수정</h1>

            <div className="book-create-info">
              <div className="book-create-field">
                <label htmlFor="title">작품 제목</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="book-create-field">
                <label htmlFor="author">작가명</label>
                <input
                  id="author"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                />
              </div>

              <div className="book-create-field book-create-description">
                <label htmlFor="description">작품 소개</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <form className="book-create-account" onSubmit={handleSubmit}>
              <div className="book-create-field">
                <label htmlFor="userId">ID</label>
                <input
                  id="userId"
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                />
              </div>

              <div className="book-create-field">
                <label htmlFor="password">비밀번호 확인</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>
            </form>
          </section>

          <section className="book-create-right">
            <h2>작품 내용</h2>

            <textarea
              className="book-create-content"
              name="content"
              value={form.content}
              onChange={handleChange}
            />

            <p className="book-create-count">글자수 {countChars(form.content)}자</p>

            {/* 기존 표지 또는 새로 선택한 AI 표지 */}
            {coverImageUrl && (
              <div className="book-create-cover-preview">
                <h3>현재 적용된 표지</h3>
                <img
                  src={coverImageUrl}
                  alt={`${form.title} 표지`}
                  className="book-create-cover-image"
                />
              </div>
            )}

            {/* 1. 전문 기반 AI 표지 생성 */}
            <section className="book-create-ai-section">
              <h2>AI 표지 생성</h2>

              <BookCoverGenerator book={aiBook} onSave={handleSaveCover} />
            </section>

            {/* 2. AI 작품 분석 + 장르·요약 기반 표지 생성 */}
            <section className="book-create-ai-section">
              <h2>AI 작품 분석</h2>

              <BookAnalysis book={aiBook} onSaveCover={handleSaveCover} />
            </section>

            <button
              type="button"
              className="book-create-submit"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? "수정 중..." : "수정 완료"}
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BookEdit;
