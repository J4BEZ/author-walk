// 사용자 역할 (users 레코드의 role)
// role 이 없으면 보통 사용자입니다. 가입으로는 role 을 정할 수 없고 (createUser 가 필드를 골라 담음),
// 서버를 돌리는 사람이 npm run set-role 로만 붙이거나 뗍니다.

/** 모든 책을 수정, 삭제할 수 있는 관리자 */
export const ADMIN_ROLE = 'admin';

/** set-role 로 붙일 수 있는 역할 목록 */
export const ROLES = [ADMIN_ROLE];
