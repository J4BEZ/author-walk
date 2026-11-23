import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userId: "",
    password: "",
  });

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.userId.trim() || !form.password.trim()) {
      alert("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    // 임시 로그인: 실제 서버 인증이 아님
    sessionStorage.setItem("userId", form.userId);

    alert("로그인되었습니다.");
    navigate("/main");
  };

  return (
    <>
      <Header />

      <main className="login-page">
        <div className="login-container">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-header">
              <h2>로그인</h2>
            </div>

            <div className="login-field">
              <label htmlFor="userId">아이디</label>
              <input
                id="userId"
                name="userId"
                type="text"
                placeholder="아이디를 입력하세요"
                value={form.userId}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-submit">
              로그인
            </button>

            <div className="login-signup">
              <span>아직 계정이 없으신가요?</span>
              <button type="button" onClick={() => navigate("/signup")}>
                회원가입
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Login;
