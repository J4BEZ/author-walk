// /books 경로 묶음 : index.js 에서 server.use('/books', booksRoutes(router)) 로 붙입니다
// 여기서 통과한 요청 (next) 은 json-server router 가 이어서 처리합니다

import express from 'express';

import { hashOnCreate, requireOwner, verifyOwnerRoute } from '../middlewares/owner.js';


/**
 * @param {any} router  json-server router (db 를 읽고 쓰는 데 사용)
 * @returns {import('express').Router}
 */
export function booksRoutes(router) {
  const books = express.Router();

  books.post('/', hashOnCreate);                         // 등록 : 평문 -> 해시
  books.post('/:id/verify', verifyOwnerRoute(router));   // 본인 확인 전용 경로
  books.use('/:id', requireOwner(router));               // 수정, 삭제 : 본인만

  return books;
}
