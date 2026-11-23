import {useNavigate} from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import {useSignupForm} from "../features/auth/hooks/useSignupForm.js";

// 마크업, class 이름은 feature/components 의 SignUp.jsx 와 같게 둡니다 (스타일은 그 브랜치의 SignUp.css)
// 입력, 칸별 검사, 제출은 useSignupForm 이 맡고, 이 화면은 성공 후 어디로 갈지만 정합니다
function Signup() {
  const navigate = useNavigate();
  const {form, fieldErrors, error, submitting, handleChange, handleSubmit} = useSignupForm({
    onSuccess: () => {
      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/login");
    },
  });

  return (
    <>
      <Header />

      <main className="signup-page">
        <div className="signup-container">
          <div className="signup-intro">
            <h1>걷기가 서재</h1>
            <p>당신만의 이야기를 시작해 보세요</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
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
                placeholder="영문, 숫자, 밑줄 2~15자"
                value={form.userId}
                onChange={handleChange}
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.userId)}
              />
              {fieldErrors.userId && <p className="signup-field-error">{fieldErrors.userId}</p>}
            </div>

            <div className="signup-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="영문, 숫자, 특수문자 포함 8~15자"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && <p className="signup-field-error">{fieldErrors.password}</p>}
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
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              {fieldErrors.confirmPassword && (
                <p className="signup-field-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="signup-submit" disabled={submitting}>
              {submitting ? "가입 중..." : "회원가입"}
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
