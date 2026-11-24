import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../features/auth/hooks/useAuth.js";
import "../styles/Header.css";

// 로그인 여부는 useAuth 의 user 로 판단합니다 (페이지가 넘기던 isLoggedIn 은 더 이상 쓰지 않음)
function Header() {
  const navigate = useNavigate();
  const {user, checking, logout} = useAuth();
  const isLoggedIn = Boolean(user);

  const handleLogout = () => {
    logout();
    navigate("/main");
  };

  return (
    <header className="header">
      <Link to="/main" className="header-logo">
        <p className="header-logo-sub">걷기가 서재</p>
        <h1 className="header-logo-title">작가의 산책</h1>
      </Link>

      <nav className="header-nav">
        <Link to="/books">작품 둘러보기</Link>

        {/* 확인 중 (새로고침 직후 저장된 토큰을 서버에 묻는 동안) 에는 로그인, 로그아웃 둘 다 그리지 않음 */}
        {checking ? null : isLoggedIn ? (
          <>
            <Link to="/books/new">글쓰기</Link>

            {/* 임시 : 로그아웃 버튼 모양은 UI 담당 디자인 (header-logout) 에 맞춰 바뀔 예정 */}
            <button type="button" className="header-logout" onClick={handleLogout}>
              {user.userId} 님 로그아웃
            </button>

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
          <Link to="/login" className="header-login">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
