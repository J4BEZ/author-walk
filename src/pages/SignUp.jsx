import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userId: "",
    nickname: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const {name, value} = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const {userId, nickname, password, confirmPassword} = form;

    if (!userId.trim() || !nickname.trim() || !password || !confirmPassword) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    if (userId.trim().length < 4) {
      setError("아이디는 4자 이상 입력해 주세요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상 입력해 주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // TODO: 실제 회원가입 API 연동
    alert(
      "입력값 검증이 완료되었습니다. 실제 회원가입은 API 연결 후 가능합니다.",
    );
  };

  return (
    <>
      <Header />

      <main className="signup-page">
        <div className="signup-container">
          <div className="signup-intro">
            <h1>걷기가 서재</h1>
            <p>당신만의 이야기를 시작해 보세요</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-form-header">
              <h2>회원가입</h2>
              <p>걷기가 서재의 새로운 작가이자 독자가 되어보세요!</p>
            </div>

            <div className="signup-field">
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

            <div className="signup-field">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="사용할 닉네임을 입력하세요"
                value={form.nickname}
                onChange={handleChange}
                autoComplete="nickname"
              />
            </div>

            <div className="signup-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="8자 이상 입력하세요"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="signup-field">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="signup-submit">
              회원가입
            </button>

            <div className="signup-login">
              <span>이미 계정이 있으신가요?</span>
              <button type="button" onClick={() => navigate("/login")}>
                로그인
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Signup;
