import {Routes, Route, Navigate} from "react-router-dom";

import Main from "./pages/Main.jsx";
import LoggedInPage from "./pages/LoggedInPage.jsx";
import Books from "./pages/Books.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import BookCreate from "./pages/BookCreate.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="/main" element={<Main />} />
      <Route path="/logged-in" element={<Main />} />
      <Route path="/books" element={<Books />} />
      <Route path="/books/new" element={<BookCreate />} />
      <Route path="/books/:id" element={<BookDetail />} />
    </Routes>
  );
}

export default App;
