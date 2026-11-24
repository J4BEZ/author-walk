// 사용자 역할 (users 레코드의 role) : 'admin' 또는 'user' 두 가지
// 가입하면 항상 'user' 이고 (createUser 가 정함, 요청 본문의 role 은 무시),
// 서버를 돌리는 사람만 npm run set-role 로 승격, 강등합니다.

/** 모든 책을 수정, 삭제할 수 있는 관리자 */
export const ADMIN_ROLE = 'admin';

/** 보통 사용자 : 자기 책만 수정, 삭제 (가입하면 이 역할) */
export const USER_ROLE = 'user';

/** 있을 수 있는 역할 목록 (set-role 이 받는 값) */
export const ROLES = [ADMIN_ROLE, USER_ROLE];

/**
 * 이 user 가 이 책을 수정, 삭제할 수 있는지 (서버 requireOwner 와 화면 버튼 표시가 함께 씀)
 * - 관리자는 모든 책, 보통 사용자는 자기 책만
 * @param {{ userId: string, role?: string } | null} user  로그인한 사람 (서버 req.user, 화면 useAuth 의 user)
 * @param {{ userId: string | null }} book
 * @returns {boolean}  로그인 안 했으면 false
 */
export function canModifyBook(user, book) {
  if (!user) return false;

  // 관리자는 모든 책을 수정 또는 삭제할 수 있음
  if (user.role === ADMIN_ROLE) return true;

  // 책의 userId 와 user 의 userId 비교
  return book.userId === user.userId;
}
