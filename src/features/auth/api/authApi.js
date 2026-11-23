// 로그인, 가입 API (서버 : server/routes/auth.js)
import { request } from '#src/api/client.js';

/**
 * 회원가입
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<void>}  회원가입 성공 시 반환 (실패하면 에러)
 */
export async function signup(userId, password) {
  await request('/auth/signup', {
    method: 'POST',
    body: { userId, password },
  });
}

/**
 * 로그인 : 성공하면 토큰
 * @returns {Promise<string>}  로그인 성공 시 발급된 인증 토큰 (JWT)
 */
export async function login(userId, password) {
  const { token } = await request('/auth/login', {
    method: 'POST',
    body: { userId, password },
  });
  return token;
}

/**
 * 토큰의 주인 : 성공하면 { userId }
 * @param {string} token  인증 토큰 (로그인 시 발급된 JWT)
 * @returns {Promise<{ userId: string }>}  토큰이 유효하면 주인 정보 반환 (실패하면 에러)
 */
export async function getMe(token) {
  const { user } = await request('/auth/me', {
    token,
  });
  return { user };
}