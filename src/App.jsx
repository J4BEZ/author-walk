import {Routes, Route, Navigate} from "react-router-dom";

import {useBookList} from "./features/books/hooks/useBooks.js";
import {useAuth} from "./features/auth/hooks/useAuth.js";

import Main from "./pages/Main.jsx";
import Signup from "./pages/SignUp.jsx";
import Login from "./pages/Login.jsx";
import Books from "./pages/Books.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import BookCreate from "./pages/BookCreate.jsx";
import BookEdit from "./pages/BookEdit.jsx";

function App() {
  // 전체 도서 목록은 여기서 한 번만 불러오고, 페이지에는 쓰는 값만 props 로 내려 줍니다
  // (페이지마다 부르면 페이지를 열 때마다 목록을 다시 받고, 등록, 수정, 삭제 결과가 다른 페이지에 바로 반영되지 않음)
  // 책 쓰기 (등록, 수정, 삭제) 에 쓸 로그인 토큰 : books 와 auth 두 feature 는 여기 (App) 에서 이어 줌
  const {token} = useAuth();
  const booksState = useBookList(token);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="/main" element={<Main booksState={booksState} />} />
      <Route path="/logged-in" element={<Main booksState={booksState} />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/books" element={<Books booksState={booksState} />} />
      <Route path="/books/new" element={<BookCreate addBook={booksState.addBook} />} />
      <Route path="/books/:id/edit" element={<BookEdit editBook={booksState.editBook} />} />
      <Route
        path="/books/:id"
        element={
          <BookDetail
            editBook={booksState.editBook}
            changeCover={booksState.changeCover}
            removeBook={booksState.removeBook}
          />
        }
      />
    </Routes>
  );
}

export default App;
