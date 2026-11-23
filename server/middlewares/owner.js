// 인가 : 이 사람이 이 책을 고칠 수 있는지 (인증은 utils/users.js)

import { authenticate } from '../utils/users.js';

import { isBlank } from '#src/utils/validation/text.js'

// 보호가 필요한 HTTP 메서드 목록 (PATCH, PUT, DELETE)
const GUARDED_METHODS = ['PATCH', 'PUT', 'DELETE'];

/**
 * POST /books: 책 등록 시 본인 확인 (아이디와 비밀번호)
 */
export function ownerOnCreate(router) {
  return async (req, res, next) => {

    // async 미들웨어에서 난 에러를 catch할 수 있도록 try-catch 진행
    try {
      const { userId, password } = req.body;

      // userId, password 가 둘 다 비어 있지 않은 문자열이 아니면 400
      if (isBlank(userId) || isBlank(password)) {
        return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해야 합니다.' });
      }

      // 사용자가 존재하면 수정 가능 여부 확인 (비밀번호 체크)
      if (!await authenticate(router, { userId, password })) {
        return res.status(403).json({ message: '아이디 또는 비밀번호가 맞지 않습니다.' });
      }

      // 본문에서 password, passwordHash 지우고 next() (userId 는 남김)
      delete req.body.password;
      delete req.body.passwordHash;
      req.body.likes = 0; // 좋아요 수는 서버만 정함 (등록은 항상 0)
      next();
    } catch (err) {
      next(err);
    }
  };
}


/**
 * 인가 : 이 user 가 이 책을 고칠 수 있는지 (role 이 생기면 여기만 수정)
 * @returns {boolean}
 */
function canModify(user, book) {

  // 책의 userId 와 user 의 userId 비교 (지금은 본인만 가능)
  return book.userId === user.userId;
}

/**
 * 아이디와 비밀번호가 그 책 주인 것과 맞는지 확인
 * @param {any} router
 * @param {string} bookId
 * @returns {Promise<boolean>}
 */
async function isOwner(router, bookId, credentials) {

  const book = findBook(router, bookId);
  if (!book) return false; // 책이 없으면 false

  const user = await authenticate(router, credentials);
  if (!user) return false; // 인증 실패하면 false

  // 책의 userId 와 user 의 userId 비교
  return canModify(user, book);
}

/**
 * POST /books/:id/verify : 본인인지 { ok } 로 답합니다 (수정 화면을 열기 전 확인용)
 */
export function verifyOwnerRoute(router) {
  return async (req, res, next) => {
    try {
      res.json({ ok: await isOwner(router, req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  };
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
 * PATCH, PUT, DELETE /books/:id : 본인이 아니면 403, 맞으면 자격 정보를 지우고 통과
 */
export function requireOwner(router) {
  return async (req, res, next) => {
    try {
      // 검사를 마친 뒤 json-server에서 메서드가 바뀌지 않도록 합니다.
      delete req.headers['x-http-method-override'];
      // GUARDED_METHODS 가 아니면 (GET 등) 바로 next()
      if (!GUARDED_METHODS.includes(req.method)) return next();

      const bookId = req.params.id;

      // 없는 책 찾으면 router 로 그대로 넘겨 router가 직접 404 반환하도록
      const book = findBook(router, bookId);
      if (!book) return next();

      // isOwner 가 false 면 res.status(403).json({ message: '...' }) 로 끝내기 (next 부르지 않음)
      if (!await isOwner(router, bookId, req.body)) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }

      // 통과하면 본문에서 userId, password, passwordHash, likes 지우고 next()
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
    } catch (err) {
      next(err);
    }
  };
}
