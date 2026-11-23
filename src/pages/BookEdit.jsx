import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BookCoverGenerator from "../features/OpenAI_Integration/BookCoverGenerator.jsx";

import {
  normalizeBookInput,
  validateNewBook,
} from "../features/books/utils/bookValidation.js";

import "../styles/BookCreate.css";

function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

function BookEdit() {
  const {id} = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    author: "",
    userId: "",
    description: "",
    content: "",
    password: "",
  });

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 기존 작품 불러오기
  useEffect(() => {
    const loadBook = async () => {
      try {
        const res = await fetch(`http://localhost:3000/books/${id}`);

        if (!res.ok) {
          throw new Error("작품을 불러오지 못했습니다.");
        }

        const book = await res.json();

        setForm({
          title: book.title ?? "",
          author: book.author ?? "",
          userId: book.userId ?? "",
          description: book.description ?? "",
          content: book.content ?? "",
          password: "",
        });

        setCoverImageUrl(book.coverImageUrl ?? "");
      } catch (e) {
        console.error(e);
        alert("작품을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 작품 수정
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
      const res = await fetch(`http://localhost:3000/books/${id}`);

      if (!res.ok) {
        throw new Error("작품 정보를 확인하지 못했습니다.");
      }

      const originalBook = await res.json();

      // 기존 비밀번호 확인
      if (originalBook.password !== clean.password) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      const updated = await fetch(`http://localhost:3000/books/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: clean.title,
          author: clean.author,
          userId: clean.userId,
          description: clean.description,
          content: clean.content,
          coverImageUrl,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!updated.ok) {
        throw new Error("작품 수정에 실패했습니다.");
      }

      alert("작품이 수정되었습니다.");
      navigate(`/books/${id}`);
    } catch (e) {
      console.error(e);
      alert("작품 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header isLoggedIn={true} />
        <main className="book-create-page">
          <p>작품 정보를 불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header isLoggedIn={true} />

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

            {/* 기존 표지 */}
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

            {/* AI 표지 재생성 */}
            <BookCoverGenerator
              book={{...form, coverImageUrl}}
              onSave={async (dataUrl) => {
                setCoverImageUrl(dataUrl);
              }}
            />

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
