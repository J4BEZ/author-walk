import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import BookLikesProvider from "./components/BookLikesProvider.jsx";
import AuthProvider from "./features/auth/components/AuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BookLikesProvider>
          <App />
        </BookLikesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
