import {Link} from "react-router-dom";
import "../styles/Header.css";

function Header({isLoggedIn = false}) {
  return (
    <header className="header">
      <Link to={isLoggedIn ? "/logged-in" : "/main"} className="header-logo">
        <p className="header-logo-sub">걷기가 서재</p>
        <h1 className="header-logo-title">작가의 산책</h1>
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
