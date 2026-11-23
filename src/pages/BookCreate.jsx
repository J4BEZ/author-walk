import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useBookList} from "../features/books/hooks/useBooks.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

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

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      });

      alert(`등록했습니다 (id ${saved.id})`);
      navigate(`/books/${saved.id}`);
    } catch (e) {
      alertError(e, "등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header isLoggedIn={true} />

      <main className="book-create-page">
        <form className="book-create-layout" onSubmit={handleSubmit}>
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

            <div className="book-create-account">
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
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
            </div>
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

            <button type="button" className="book-create-ai-button">
              AI 표지 생성
            </button>

            <button
              type="submit"
              className="book-create-submit"
              disabled={submitting}>
              {submitting ? "등록 중..." : "작품 등록"}
            </button>
          </section>
        </form>
      </main>

      <Footer />
    </>
  );
}

export default BookCreate;
