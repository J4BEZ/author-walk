import "../styles/Header.css";

function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <p>걷기가 서재</p>
        <h1>작가의 산책</h1>
      </div>

      <nav className="header-nav">
        <a href="/main">홈</a>
        <a href="/books">작품 둘러보기</a>
        <a href="/login" className="header-login">
          로그인
        </a>
      </nav>
    </header>
  );
}

export default Header;
