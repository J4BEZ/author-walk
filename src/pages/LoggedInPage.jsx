import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/LoggedInPage.css";

function LoggedInPage() {
  return (
    <>
      <Header isLoggedIn={true} />
      <main className="logged-in-main">
        <section className="logged-in-intro">
          <h1>안녕하세요, 이름님</h1>
          <a href="/books/new">오늘은 어떤 이야기를 만들어볼까요?</a>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default LoggedInPage;
