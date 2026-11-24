import {Link} from "react-router-dom";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

import "../App.css";
import "../styles/font.css";

// 라우트에 없는 주소 (아직 만들지 않은 메뉴 포함) 를 받는 화면
// 스타일은 메인 인사 영역 (.main-intro) 을 그대로 씀
function NotFound() {
  return (
    <>
      <Header />

      <main>
        <section className="main-intro">
          <h1>준비 중인 페이지예요</h1>
          <Link to="/main">메인으로 돌아가기 →</Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default NotFound;
