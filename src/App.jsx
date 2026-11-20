import {useState} from "react";
import {useBooks, useBook} from "./features/books/useBooks.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import NewBooks from "./components/NewBooks.jsx";

import "./App.css";
import "./styles/font.css";

/** @import { BookView } from './features/books/types.js' */
//

const SAMPLE_COVER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * 에러를 alert 문구로 (본인 확인 실패는 그 메시지 그대로)
 * @param {unknown} e
 * @param {string} fallback
 */
function alertError(e, fallback) {
  console.error(e);
  alert(e instanceof Error && e.cause === "NOT_OWNER" ? e.message : fallback);
}

function App() {
  // useBooks 는 앱에서 한 번만 부르고, 필요한 화면에 props 로 내려 줍니다
  // (화면마다 따로 부르면 목록 State 가 따로 생겨서 서로 반영되지 않음)
  const booksState = useBooks();
  const [selectedId, setSelectedId] = useState(
    /** @type {number | null} */ (null),
  );

  return (
    <>
      <Header />
      <main>
        <section className="main-intro">
          <h1>당신도 작가가 될 수 있어요</h1>
          <a href="/login">로그인하고 글쓰기 →</a>
        </section>

        <SearchBar onSearch={booksState.reload} />

        <NewBooks books={booksState.books} onSelect={setSelectedId} />
        <BookListScreen {...booksState} onSelect={setSelectedId} />
        <BookCreateScreen addBook={booksState.addBook} />
        {selectedId !== null && (
          <BookDetailScreen
            id={selectedId}
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
 * 목록 화면 (/books) : 목록, 검색
 * @param {ReturnType<typeof useBooks> & { onSelect: (id: number) => void }} props
 */
function BookListScreen({books, loading, error, reload, onSelect}) {
  const [query, setQuery] = useState("");

  return (
    <section>
      <h2>목록 화면</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색어"
      />
      <button onClick={() => reload(query.trim())}>검색</button>
      <button
        onClick={() => {
          setQuery("");
          reload();
        }}>
        전체 보기
      </button>

      {/* 로딩 -> 에러 -> 빈 목록 -> 정상 순서 */}
      {loading ? (
        <p>불러오는 중입니다.</p>
      ) : error ? (
        <p>{error}</p>
      ) : books.length === 0 ? (
        <p>등록된 도서가 없습니다.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <button onClick={() => onSelect(book.id)}>
                {book.title} · {book.author} · {book.createdAt.slice(0, 10)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * 등록 화면 (/books/new) : 유효성 검사 -> addBook
 * @param {{ addBook: ReturnType<typeof useBooks>['addBook'] }} props
 */
function BookCreateScreen({addBook}) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    content: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // 입력칸 하나를 바꾸는 공통 핸들러 (name 속성으로 어느 칸인지 구분)
  const handleChange = (
    /** @type {import('react').ChangeEvent<HTMLInputElement>} */ e,
  ) => setForm((prev) => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async () => {
    // 유효성 검사 : 공백만 입력한 경우도 막기
    if (
      !form.title.trim() ||
      !form.author.trim() ||
      !form.content.trim() ||
      !form.password
    ) {
      alert("제목, 작성자, 내용, 비밀번호를 모두 입력해 주세요");
      return;
    }
    setSubmitting(true); // 연타 막기
    try {
      const saved = await addBook({
        ...form,
        title: form.title.trim(),
        author: form.author.trim(),
      });
      alert(`등록했습니다 (id ${saved.id})`);
      setForm({title: "", author: "", content: "", password: ""}); // 성공했을 때만 비우기
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
 * 상세 + 수정 화면 (/books/:id, /books/:id/edit) : useBook 으로 한 권 불러오기, 수정, 표지 저장, 삭제
 * @param {{
 *   id: number,
 *   editBook: ReturnType<typeof useBooks>['editBook'],
 *   changeCover: ReturnType<typeof useBooks>['changeCover'],
 *   removeBook: ReturnType<typeof useBooks>['removeBook'],
 *   onDeleted: () => void,
 * }} props
 */
function BookDetailScreen({id, editBook, changeCover, removeBook, onDeleted}) {
  const {book, loading, error, setBook} = useBook(id);
  const [author, setAuthor] = useState("");
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

  const credentials = {author, password};

  // 수정 : 본인 확인은 editBook 안에서. 받은 값으로 상세 화면도 바로 바꿈
  const handleEdit = async () => {
    if (!newTitle.trim()) return alert("새 제목을 입력해 주세요");
    try {
      /** @type {BookView} */
      const updated = await editBook(
        book.id,
        {title: newTitle.trim()},
        credentials,
      );
      setBook(updated);
      setNewTitle("");
    } catch (e) {
      alertError(e, "수정에 실패했어요");
    }
  };

  // 표지 저장 : 실제로는 OpenAI 응답의 b64_json 으로 만든 Data URL 을 넘김
  const handleCover = async () => {
    try {
      setBook(await changeCover(book.id, SAMPLE_COVER));
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
      <p>{book.content}</p>
      <p>
        등록 {book.createdAt.slice(0, 10)} · 수정 {book.updatedAt.slice(0, 10)}
      </p>

      <h3>본인 확인 (수정, 삭제에 사용)</h3>
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="작성자"
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
      <button onClick={handleCover}>표지 저장 (예시 이미지)</button>
      <button onClick={handleDelete}>삭제</button>
    </section>
  );
}

export default App;
