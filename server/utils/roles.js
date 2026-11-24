// 사용자 역할 (users 레코드의 role) : 'admin' 또는 'user' 두 가지
// 가입하면 항상 'user' 이고 (createUser 가 정함, 요청 본문의 role 은 무시),
// 서버를 돌리는 사람만 npm run set-role 로 승격, 강등합니다.

/** 모든 책을 수정, 삭제할 수 있는 관리자 */
export const ADMIN_ROLE = 'admin';

/** 보통 사용자 : 자기 책만 수정, 삭제 (가입하면 이 역할) */
export const USER_ROLE = 'user';

/** 있을 수 있는 역할 목록 (set-role 이 받는 값) */
export const ROLES = [ADMIN_ROLE, USER_ROLE];
