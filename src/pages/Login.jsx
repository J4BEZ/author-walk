import {useNavigate} from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import {useLoginForm} from "../features/auth/hooks/useLoginForm.js";

// 마크업, class 이름은 feature/components 의 Login.jsx 와 같게 둡니다 (스타일은 그 브랜치의 Login.css)
// 입력, 제출, 실패 메시지는 useLoginForm 이 맡고, 이 화면은 성공 후 어디로 갈지만 정합니다
function Login() {
  const navigate = useNavigate();
  const {form, error, submitting, handleChange, handleSubmit} = useLoginForm({
    onSuccess: () => navigate("/main"),
  });

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

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "로그인 중..." : "로그인"}
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
