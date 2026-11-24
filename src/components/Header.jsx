import {useState, useEffect, useRef} from "react";
import {Link} from "react-router-dom";
import "../styles/Header.css";

function Header({isLoggedIn = false}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 메뉴 바깥을 클릭하면 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    closeMenu();

    // TODO: 로그아웃 API 연동
    alert("로그아웃 기능은 추후 연결 예정입니다.");
  };

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

            <div className="header-menu-wrapper" ref={menuRef}>
              <button
                type="button"
                className={`hamburger-button ${isMenuOpen ? "active" : ""}`}
                aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}>
                <span />
                <span />
                <span />
              </button>

              {isMenuOpen && (
                <div className="header-dropdown">
                  <Link to="/mypage" onClick={closeMenu}>
                    마이페이지
                  </Link>

                  <Link to="/my-books" onClick={closeMenu}>
                    내 작품
                  </Link>

                  <Link to="/subscriptions" onClick={closeMenu}>
                    구독 작품
                  </Link>

                  <div className="header-dropdown-divider" />

                  <button
                    type="button"
                    className="header-logout"
                    onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="header-login">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
