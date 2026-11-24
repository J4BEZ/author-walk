// 가입 폼 검사 : 서버와 같은 규칙 (src/utils/validation/users.js) 에 비밀번호 확인을 더합니다
import { validatePassword, validateUserId } from '#src/utils/validation/users.js';

/**
 * 가입 폼의 칸별 메시지를 만듭니다
 * 모양은 서버 400, 409 응답의 errors 와 같아서, 화면 검사와 서버 검사를 같은 곳에 그릴 수 있습니다
 * @param {{ userId: string, password: string, confirmPassword: string }} form
 * @returns {Record<string, string>}  틀린 칸만 담긴 객체 (모두 맞으면 빈 객체)
 */
export function validateSignupForm({ userId, password, confirmPassword }) {
  const userIdError = validateUserId(userId);
  const passwordError = validatePassword(password);

  return {
    ...(userIdError && { userId: userIdError }),
    ...(passwordError && { password: passwordError }),
    ...(password !== confirmPassword && { confirmPassword: '비밀번호가 일치하지 않습니다.' }),
  };
}
