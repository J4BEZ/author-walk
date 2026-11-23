import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useBookList} from "../features/books/hooks/useBooks.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BookCoverGenerator from "../features/OpenAI_Integration/components/BookCoverGenerator.jsx";
import BookAnalysis from "../features/OpenAI_Integration/components/BookAnalysis.jsx";

import {
  normalizeBookInput,
  validateNewBook,
} from "../features/books/utils/bookValidation.js";

import "../styles/BookCreate.css";

function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

function BookCreate() {
  const navigate = useNavigate();
  const {addBook} = useBookList();

  const [form, setForm] = useState({
    title: "",
    author: "",
    userId: "",
    description: "",
    content: "",
    password: "",
  });

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCover = async (dataUrl) => {
    setCoverImageUrl(dataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    const clean = normalizeBookInput(form);
    const message = joinErrors(validateNewBook(clean));

    if (message) {
      alert(message);
      return;
    }

    setSubmitting(true);

    try {
      const saved = await addBook({
        title: clean.title,
        author: clean.author,
        userId: clean.userId,
        description: clean.description,
        content: clean.content,
        password: clean.password,
        coverImageUrl,
      });

      alert(`등록했습니다 (id ${saved.id})`);
      navigate(`/books/${saved.id}`);
    } catch (e) {
      alertError(e, "등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  const aiBook = {
    title: form.title,
    author: form.author,
    content: form.content,
  };

  return (
    <>
      <Header isLoggedIn={true} />

      <main className="book-create-page">
        <div className="book-create-layout">
          <section className="book-create-left">
            <h1>작품 등록</h1>

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
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <p className="book-create-count">글자수 {form.content.length}자</p>

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

            {/* 2. AI 작품 분석 + 요약 기반 표지 생성 */}
            <section className="book-create-ai-section">
              <h2>AI 작품 분석</h2>

              <BookAnalysis book={aiBook} onSaveCover={handleSaveCover} />
            </section>

            <button
              type="button"
              className="book-create-submit"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? "등록 중..." : "작품 등록"}
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default BookCreate;
