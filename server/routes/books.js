// /books 경로 묶음 : index.js 에서 server.use('/books', booksRoutes(router)) 로 붙입니다
// 여기서 통과한 요청 (next) 은 json-server router 가 이어서 처리합니다

import express from 'express';

import { forGuardedMethods, ownerOnCreate, requireOwner } from '../middlewares/owner.js';
import { requireAuth } from '../middlewares/auth.js';
import { coverOnSave } from '../middlewares/covers.js';


/**
 * @param {any} router  json-server router (db 를 읽고 쓰는 데 사용)
 * @returns {import('express').Router}
 */
export function booksRoutes(router) {
  const books = express.Router();

  // 누구인지는 토큰으로 (requireAuth -> req.user), 고칠 수 있는지는 requireOwner
  // 읽기 (GET) 는 여기서 손대지 않고 지나가 json-server router 가 처리 (로그인 없이 누구나)
  const auth = requireAuth(router);

  books.post('/', auth, ownerOnCreate(), coverOnSave(router));             // 등록 : 로그인한 사람이 주인, 표지는 파일로
  books.post('/:id/likes', likeRoute(router));                             // 좋아요 +1 : 로그인 없이 (토글은 나중에)
  books.use('/:id', forGuardedMethods(auth), requireOwner(router),         // 수정, 삭제 : 로그인 + 본인만
    forGuardedMethods(coverOnSave(router)));                               // 표지 저장, 바꾸기, 글 삭제 때 표지 폴더 삭제

  return books;
}

/**
 * POST /books/:id/likes : 좋아요 수를 1 올리고 { likes } 로 답합니다 (없는 책은 404)
 * @param {any} router
 * @returns {import('express').RequestHandler}
 */
function likeRoute(router) {
  return (req, res) => {
    const book = router.db.get('books').getById(req.params.id);
    const record = book.value();
    if (!record) return res.sendStatus(404);

    // 동기식 DB 갱신으로 동시에 들어온 요청도 각각 한 번씩 반영합니다.
    const likes = (record.likes ?? 0) + 1;
    book.assign({ likes }).write();
    return res.json({ likes });
  };
}
