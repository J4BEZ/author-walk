// 계정 역할 : 서버 server/utils/roles.js 와 같은 값
export const ADMIN_ROLE = 'admin';

/**
 * 관리자인지 (로그인 안 했으면 false)
 * @param {{ role?: string } | null} user  useAuth 의 user
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user?.role === ADMIN_ROLE;
}
