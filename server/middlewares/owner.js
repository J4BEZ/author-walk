

import { hashPassword, verifyPassword } from '../utils/password.js';

// 보호가 필요한 HTTP 메서드 목록 (PATCH, PUT, DELETE)
const GUARDED_METHODS = ['PATCH', 'PUT', 'DELETE'];

/**
 * 등록 : 평문 비밀번호를 해시로 바꿔 저장 (평문은 저장하지 않음)
 * @type {import('express').RequestHandler}
 */
export function hashOnCreate(req, res, next) {
  // 들어온 passwordHash 는 지우기 (클라이언트가 해시를 직접 정하지 못하도록)
  delete req.body.passwordHash;

  // req.body.password 가 있으면 hashPassword 로 passwordHash 만들기
  if (req.body.password) {
    req.body.passwordHash = hashPassword(req.body.password);
  }

  // req.body.password 지우기
  delete req.body.password;

  next(); // 다음 미들웨어 (결국 router 가 저장)
}

/**
 * 본인 확인에 쓸 기록을 꺼냅니다    
 * (지금은 책 자체, users 도입 후에는 책 주인 user 로 이 함수만 수정)
 * @param {any} router
 * @param {number} bookId
 */
function findCredentialRecord(router, bookId) {
  return router.db.get('books').find({ id: bookId }).value();
}

/**
 * 아이디와 비밀번호가 그 책 주인 것과 맞는지
 * @returns {boolean}
 */
function isOwner(router, bookId, { userId, password } = {}) {
  const record = findCredentialRecord(router, bookId);
  // record 가 없으면 false
  if (!record) return false;

  // record.userId 가 null 이거나 userId 와 다르면 false
  if (!record.userId || record.userId !== userId) return false;

  // Password 확인 결과 반환
  return verifyPassword(password, record.passwordHash);
}

/**
 * POST /books/:id/verify : 본인인지 { ok } 로 답합니다 (수정 화면을 열기 전 확인용)
 */
export function verifyOwnerRoute(router) {
  return (req, res) => {
    res.json({ ok: isOwner(router, Number(req.params.id), req.body) });
  };
}


/**
 * 책 한 권 원본을 꺼냅니다 (없으면 undefined)
 * @param {any} router
 * @param {number} bookId
 */
function findBook(router, bookId) {
  return router.db.get('books').find({ id: bookId }).value();
}

/**
 * PATCH, PUT, DELETE /books/:id : 본인이 아니면 403, 맞으면 자격 정보를 지우고 통과
 */
export function requireOwner(router) {
  return (req, res, next) => {
    // GUARDED_METHODS 가 아니면 (GET 등) 바로 next()
    if (!GUARDED_METHODS.includes(req.method)) return next();

    const bookId = Number(req.params.id);

    // 없는 책 찾으면 router 로 그대로 넘겨 router가 직접 404 반환하도록
    if (!findBook(router, bookId)) return next();

    // isOwner 가 false 면 res.status(403).json({ message: '...' }) 로 끝내기 (next 부르지 않음)
    if (!isOwner(router, Number(req.params.id), req.body)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 통과하면 본문에서 userId, password, passwordHash 지우고 next()
    delete req.body.userId;
    delete req.body.password;
    delete req.body.passwordHash;
    next();
  };
}