// /books 경로 묶음 : index.js 에서 server.use('/books', booksRoutes(router)) 로 붙입니다
// 여기서 통과한 요청 (next) 은 json-server router 가 이어서 처리합니다

import express from 'express';

import { ownerOnCreate, requireOwner, verifyOwnerRoute } from '../middlewares/owner.js';


/**
 * @param {any} router  json-server router (db 를 읽고 쓰는 데 사용)
 * @returns {import('express').Router}
 */
export function booksRoutes(router) {
  const books = express.Router();

  books.post('/', ownerOnCreate(router));                // 등록
  books.post('/:id/verify', verifyOwnerRoute(router));   // 본인 확인 전용 경로
  books.post('/:id/likes', likeRoute(router));           // 좋아요 +1
  books.use('/:id', requireOwner(router));               // 수정, 삭제 : 본인만

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
