import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useBookList} from "../features/books/hooks/useBooks.js";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

import {
  normalizeBookInput,
  validateNewBook,
} from "../features/books/utils/bookValidation.js";

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

  // 입력값 변경
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 작품 등록
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

      setForm({
        title: "",
        author: "",
        userId: "",
        description: "",
        content: "",
        password: "",
      });

      // 등록 성공 후 해당 작품 상세 페이지로 이동
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

      <main>
        <section className="book-create">
          <h1>작품 등록</h1>

          <form onSubmit={handleSubmit}>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="제목"
            />

            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="작성자"
            />

            <input
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="사용자 아이디"
            />

            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="작품 소개"
            />

            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="내용"
              rows={8}
            />

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호"
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default BookCreate;
