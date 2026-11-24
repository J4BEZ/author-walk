// 인증 : 이 사람이 누구인지 확인 (users 컬렉션)
// 책 주인 확인 (middlewares/owner.js) 과 로그인 (2단계 routes/auth.js) 이 함께 씁니다

import { hashPassword, verifyPassword } from './password.js';
import { USER_ROLE } from './roles.js';


/**
 * 로그인 아이디로 user 를 찾습니다 (없으면 undefined)
 * @param {any} router
 * @param {string} userId
 */
export function findUser(router, userId) {

  return router.db.get('users').find({ userId: userId }).value();
}


/**
 * 새 user 를 저장하고 반환합니다 (id 는 json-server 가 붙임)
 * 본문을 통째로 넣지 않고 필드를 골라 담아, 클라이언트가 보낸 다른 필드 (예: role) 는 무시합니다
 * 역할은 항상 보통 사용자 ('user') 로 시작합니다 (관리자 승격은 npm run set-role)
 * @param {any} router
 * @param {string} userId
 * @param {string} password  평문 (해시로 바꿔 저장하고 평문은 저장하지 않음)
 */
export async function createUser(router, userId, password) {

  // 해시 부터 생성 (TOC-TOU 경합을 최대한 방지하기 위해 오래 걸리는 해시를 먼저 진행)
  const passwordHash = await hashPassword(password);

  // 이미 존재하는 ID인지 확인, 존재하면 null 반환
  if (findUser(router, userId)) {
    return null;
  }

  const user = {
    userId,
    passwordHash: passwordHash,
    role: USER_ROLE,
    createdAt: new Date().toISOString(),
  };
  return router.db.get('users').insert(user).write();
}


/**
 * 인증 : 아이디와 비밀번호가 맞으면 그 user, 아니면 null
 * @returns {Promise<object | null>}
 */
export async function authenticate(router, { userId, password } = {}) {

  // userId 가 문자열이 아니면 null
  if (typeof userId !== 'string') return null;

  // 주어진 userId로 사용자 찾기
  const user = findUser(router, userId);
  if (!user) {

    // 사용자가 존재하지 않는다는 정보(=> 해당 ID는 없다는 정보를 흘리지 않습니다.)
    // 너무 빨리 반환해주면 공격자가 '아 이거 존재하지 않는구나라 판단하지 못하도록' 
    // 더미 해시 계산도 진행합니다.
    await hashPassword((typeof password === 'string' ? password : '')); // 더미 해시 계산 (결과 버림)
    return null; // 그런 사용자 없으면 null 반환
  }

  // verifyPassword 가 맞으면 user, 아니면 null
  return await verifyPassword(password, user.passwordHash) ? user : null;
}
