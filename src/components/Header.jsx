import {Link} from "react-router-dom";
import "../styles/Header.css";

function Header({isLoggedIn = false}) {
  return (
    <header className="header">
      <Link to={isLoggedIn ? "/logged-in" : "/main"} className="header-logo">
        <svg className="header-logo-mark" viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <linearGradient id="logo-mark-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#63b88f" />
              <stop offset="1" stopColor="#3C9A70" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill="url(#logo-mark-grad)" />
          <path d="M11 18c5-2.5 9-2 13 1.5v16c-4-3.5-8-4-13-1.5z" fill="#fff" />
          <path d="M37 18c-5-2.5-9-2-13 1.5v16c4-3.5 8-4 13-1.5z" fill="#fff" fillOpacity=".85" />
          <circle cx="35" cy="11" r="3.5" fill="#ffd270" />
        </svg>

        <div className="header-logo-text">
          <p className="header-logo-sub">걷기가 서재</p>
          <h1 className="header-logo-title">작가의 산책</h1>
        </div>
      </Link>

      <nav className="header-nav">
        <Link to="/books">작품 둘러보기</Link>

        {isLoggedIn ? (
          <>
            <Link to="/books/new">글쓰기</Link>

            <button
              type="button"
              className="hamburger-button"
              aria-label="메뉴">
              <span />
              <span />
              <span />
            </button>
          </>
        ) : (
          <Link to="/logged-in" className="header-login">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
