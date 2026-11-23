import {Routes, Route, Navigate} from "react-router-dom";

import Main from "./pages/Main.jsx";
import LoggedInPage from "./pages/LoggedInPage.jsx";
import BookDetail from "./pages/BookDetail.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="/main" element={<Main />} />
      <Route path="/logged-in" element={<LoggedInPage />} />
      <Route path="/books/:id" element={<BookDetail />} />
    </Routes>
  );
}

export default App;
