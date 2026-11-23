import {useState} from "react";
import {useBookList, useBookDetail} from "./features/books/hooks/useBooks.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import NewBooks from "./components/NewBooks.jsx";
import BookLikeButton from "./components/BookLikeButton.jsx";

import "./App.css";
import "./styles/font.css";

// (임시) 작품 등록/수정 시 유효성 검사를 한 번에 처리하는 함수
import {
  normalizeBookInput,
  validateNewBook,
  validateBookChanges,
} from "./features/books/utils/bookValidation.js";
import BookCoverGenerator from "./features/OpenAI_Integration/BookCoverGenerator.jsx";

import {isBlank} from "#src/utils/validation/text.js";
import {queryBooks, NEW_BOOK_DAYS} from "./features/books/utils/bookQuery.js";

import "./App.css";

/** @import { BookView } from './features/books/types.js' */
//

/**
 * 에러를 alert 문구로 (본인 확인 실패는 그 메시지 그대로)
 * - 향후 정책상 브라우저 알림인 alert 대신, UI 내 알림 모달 또는 텍스트 필드 아래 빨간 설명으로 대체될 수 있습니다.
 * - 아래 함수는 임시로 만든 예시 처리 함수 입니다.
 * @param {unknown} e
 * @param {string} fallback
 */
function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

/**
 * 검사 결과의 error들을 하나로 합쳐서 반환합니다 (없으면 빈 문자열)
 *
 * - 향후 정책상 브라우저 알림인 alert 대신, UI 내 알림 모달 또는 텍스트 필드 아래 빨간 설명으로 대체될 수 있습니다.
 * - 아래 함수는 임시로 만든 예시 처리 함수 입니다.
 * @param {Record<string, string>} errors
 * @returns {string | null}
 */
function joinErrors(errors) {
  return Object.values(errors).join("\n");
}

/**
 * 기본 보기 (이번 주 신작) 함수
 * @param {BookView[]} books
 * @returns {BookView[]}
 */
const defaultView = (books) => queryBooks(books, { days: NEW_BOOK_DAYS });

function App() {
  // useBookList 는 앱에서 한 번만 부르고, 필요한 화면에 props 로 내려 줍니다
  // (화면마다 따로 부르면 목록 State 가 따로 생겨서 서로 반영되지 않음)
  const booksState = useBookList();
  const [selectedId, setSelectedId] = useState(
    /** @type {number | null} */ (null),
  );

  // 검색어가 없으면 기본 보기 (이번 주 신작), 있으면 검색 결과
  const shownBooks =  isBlank(booksState.query.q)
    ? defaultView(booksState.books)
    : booksState.books;

  return (
    <>
      <Header />
      <main>
        <section className="main-intro">
          <h1>당신도 작가가 될 수 있어요</h1>
          <a href="/login">로그인하고 글쓰기 →</a>
        </section>
        <SearchBar onSearch={booksState.reload} />
        <NewBooks books={shownBooks} onSelect={setSelectedId} likes={booksState.likes} />
        <BookCreateScreen addBook={booksState.addBook} />
        {selectedId !== null && (
          <BookDetailScreen
            key={selectedId}
            id={selectedId}
            likes={booksState.likes}
            editBook={booksState.editBook}
            changeCover={booksState.changeCover}
            removeBook={booksState.removeBook}
            onDeleted={() => setSelectedId(null)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

/**
 * 등록 화면 (/books/new) : 유효성 검사 -> addBook
 * @param {{ addBook: ReturnType<typeof useBookList>['addBook'] }} props
 */
function BookCreateScreen({addBook}) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    userId: "",
    description: "",
    content: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // 입력칸 하나를 바꾸는 공통 핸들러 (name 속성으로 어느 칸인지 구분)
  const handleChange = (
    /** @type {import('react').ChangeEvent<HTMLInputElement>} */ e,
  ) => setForm((prev) => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async () => {
    // 입력 전체에 대한 유효성 검사
    const clean = normalizeBookInput(form); // 다듬기
    const message = joinErrors(validateNewBook(clean)); // 다듬은 값으로 검사

    if (message) {
      alert(message);
      return;
    }

    setSubmitting(true); // 연타 막기
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
      }); // 성공했을 때만 비우기
    } catch (e) {
      alertError(e, "등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2>등록 화면</h2>
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
      <input
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="내용"
      />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="비밀번호"
      />
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "등록 중..." : "등록"}
      </button>
    </section>
  );
}

/**
 * 상세 + 수정 화면 (/books/:id, /books/:id/edit) : useBookDetail 으로 한 권 불러오기, 수정, 표지 저장, 삭제
 * @param {{
 *   id: number,
 *   likes: ReturnType<typeof useBookList>['likes'],
 *   editBook: ReturnType<typeof useBookList>['editBook'],
 *   changeCover: ReturnType<typeof useBookList>['changeCover'],
 *   removeBook: ReturnType<typeof useBookList>['removeBook'],
 *   onDeleted: () => void,
 * }} props
 */
function BookDetailScreen({id, likes, editBook, changeCover, removeBook, onDeleted}) {
  const {book, loading, error, setBook} = useBookDetail(id);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [newTitle, setNewTitle] = useState("");

  if (loading || (!book && !error))
    return (
      <section>
        <h2>상세 화면</h2>
        <p>불러오는 중입니다.</p>
      </section>
    );
  if (error || !book)
    return (
      <section>
        <h2>상세 화면</h2>
        <p>{error}</p>
      </section>
    );

  const credentials = {userId, password};

  // 수정 : 본인 확인은 editBook 안에서. 받은 값으로 상세 화면도 바로 바꿈
  // TODO:: 향후, Figma 디자인에 맞추어 먼저 본인 확인 modal 이후, 기존 내용으로 텍스트 필드 들이 채워진 상태에서 수정 가능하도록 개선 필요

  const handleEdit = async () => {
    const clean = normalizeBookInput({title: newTitle});
    const message = joinErrors(validateBookChanges(clean));
    if (message) return alert(message);

    try {
      /** @type {BookView} */
      const updated = await editBook(book.id, clean, credentials);
      setBook(updated);
      setNewTitle("");
    } catch (e) {
      alertError(e, "수정에 실패했어요");
    }
  };

  // 생성된 PNG Data URL을 저장하고 목록과 상세 화면에 반영합니다.
  const handleCover = async (dataUrl) => {
    try {
      setBook(await changeCover(book.id, dataUrl, credentials));
    } catch (e) {
      alertError(e, "표지 저장에 실패했어요");
    }
  };

  // 삭제 : 확인창 -> removeBook (본인 확인 포함) -> 목록으로
  const handleDelete = async () => {
    if (!confirm(`"${book.title}" 을(를) 삭제할까요?`)) return;
    try {
      await removeBook(book.id, credentials);
      onDeleted();
    } catch (e) {
      alertError(e, "삭제에 실패했어요");
    }
  };

  return (
    <section>
      <h2>상세 화면</h2>
      {book.coverImageUrl && (
        <img src={book.coverImageUrl} alt={`${book.title} 표지`} width={80} />
      )}
      <p>
        {book.title} · {book.author}
      </p>
      <BookLikeButton book={book} likes={likes} />
      {book.description && <p>{book.description}</p>}
      <p>{book.content}</p>
      <p>
        등록 {book.createdAt.slice(0, 10)} · 수정 {book.updatedAt.slice(0, 10)}
      </p>

      <h3>본인 확인 (수정, 삭제에 사용)</h3>
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

      <h3>수정 화면</h3>
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

export default App;
