// 인가 : 이 사람이 이 책을 고칠 수 있는지 (인증은 middlewares/auth.js 의 requireAuth 가 토큰으로 하고 req.user 에 담음)
//
// 본문의 userId, password 는 읽지 않고 지웁니다 (누구인지는 오직 토큰으로)
// 그래서 화면이 아이디, 비밀번호 칸을 보내든 안 보내든 결과가 같습니다 (칸을 빼도 아무 일 없음)

import { ADMIN_ROLE } from '../utils/roles.js';

// 보호가 필요한 HTTP 메서드 목록 (PATCH, PUT, DELETE)
const GUARDED_METHODS = ['PATCH', 'PUT', 'DELETE'];

/**
 * 미들웨어를 PATCH, PUT, DELETE 요청에만 적용합니다 (GET 등은 그대로 통과)
 * 예 : books.use('/:id', forGuardedMethods(requireAuth(router)), ...) -> 책 보기는 로그인 없이, 수정과 삭제만 로그인
 * @param {import('express').RequestHandler} middleware
 * @returns {import('express').RequestHandler}
 */
export function forGuardedMethods(middleware) {
  return (req, res, next) => (GUARDED_METHODS.includes(req.method) ? middleware(req, res, next) : next());
}

/**
 * POST /books : 책 주인을 토큰의 user 로 정합니다 (앞에 requireAuth 가 있어야 함)
 */
export function ownerOnCreate() {
  return (req, res, next) => {
    // 본문의 userId 가 무엇이든 로그인한 사람으로 덮어씀 (남의 이름으로 등록 방지)
    req.body.userId = req.user.userId;

    // 화면이 아직 보내는 비밀번호와, 클라이언트가 끼워 넣을 수 있는 값은 저장하지 않음
    delete req.body.password;
    delete req.body.passwordHash;
    req.body.likes = 0; // 좋아요 수는 서버만 정함 (등록은 항상 0)
    next();
  };
}


/**
 * 인가 : 이 user 가 이 책을 고칠 수 있는지 판단
 * @returns {boolean}
 */
function canModify(user, book) {

  // 관리자는 모든 책을 수정 또는 삭제할 수 있음
  if (user.role === ADMIN_ROLE) return true;

  // 책의 userId 와 user 의 userId 비교
  return book.userId === user.userId;
}


/**
 * 책 한 권 원본을 꺼냅니다 (없으면 undefined)
 * json-server router 와 같은 방식 (id 를 문자열로 비교) 으로 찾아, 검사한 책과 실제로 바뀌는 책이 어긋나지 않게 합니다
 * @param {any} router
 * @param {string} bookId
 */
function findBook(router, bookId) {
  return router.db.get('books').getById(bookId).value();
}

/**
 * PATCH, PUT, DELETE /books/:id : 본인이 아니면 403, 맞으면 본문을 정리하고 통과
 * (앞에 forGuardedMethods(requireAuth(router)) 가 있어 여기 올 때 req.user 가 있음)
 */
export function requireOwner(router) {
  return (req, res, next) => {
    // 검사를 마친 뒤 json-server에서 메서드가 바뀌지 않도록 합니다.
    delete req.headers['x-http-method-override'];
    // GUARDED_METHODS 가 아니면 (GET 등) 바로 next()
    if (!GUARDED_METHODS.includes(req.method)) return next();

    // 없는 책 찾으면 router 로 그대로 넘겨 router가 직접 404 반환하도록
    const book = findBook(router, req.params.id);
    if (!book) return next();

    // 토큰으로 확인된 user 가 이 책을 고칠 수 없으면 403 (비밀번호를 다시 확인하지 않음)
    if (!canModify(req.user, book)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 통과하면 본문에서 userId, password, passwordHash, likes 지우고 next()
    // (화면이 아직 보내는 아이디, 비밀번호도 여기서 버려짐)
    delete req.body.userId;
    delete req.body.password;
    delete req.body.passwordHash;
    delete req.body.likes;
    if (req.method === 'PUT') {
      // 전체 교체에서도 기존 좋아요 수와 책 주인 (userId) 을 유지합니다.
      const { likes = 0, userId } = book;
      Object.assign(req.body, { likes, userId });
    }
    next();
  };
}
