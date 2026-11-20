import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import LoggedInPage from "./pages/LoggedInPage.jsx";

const Page = window.location.pathname === "/logged-in" ? LoggedInPage : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
