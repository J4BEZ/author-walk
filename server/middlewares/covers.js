// 표지 저장, 지우기 : 화면이 보낸 data URL 을 파일로 저장하고 db.json 에는 주소만 남깁니다
// 등록 (POST) 은 ownerOnCreate 뒤, 수정, 삭제 (PATCH, PUT, DELETE) 는 requireOwner 뒤에 붙입니다
// (로그인, 주인 확인을 통과한 요청만 여기 옴)

import { CoverError, isCoverDataUrl, removeCover, saveCover } from '../utils/covers.js';

/**
 * 응답이 성공 (2xx) 으로 끝나면 fn, 실패로 끝나면 onFail 을 부릅니다
 * json-server router 가 db.json 에 쓴 다음 응답하므로, 지우기는 저장이 끝난 뒤에 합니다
 * @param {import('express').Response} res
 * @param {() => Promise<unknown>} fn
 * @param {() => Promise<unknown>} [onFail]
 */
function afterResponse(res, fn, onFail) {
  res.on('finish', () => {
    const job = res.statusCode < 400 ? fn : onFail;
    job?.().catch((e) => console.error('[covers] 정리 실패', e));
  });
}

/**
 * POST, PATCH, PUT, DELETE /books 의 표지 처리
 * - coverImageUrl 이 data URL : 검사 후 저장, 두 주소로 바꿈 (이전 표지 폴더는 성공 후 삭제)
 * - null, 빈 값 : 표지 없음 (이전 폴더는 성공 후 삭제)
 * - 지금 저장된 주소 그대로 : 그대로 둠
 * - 그 밖의 값 : 400
 * - coverThumbnailUrl 은 서버만 정함 (보낸 값은 무시)
 * - DELETE : 성공 후 그 책의 표지 폴더 삭제
 * @param {any} router  json-server router (지금 저장된 책 읽기)
 * @returns {import('express').RequestHandler}
 */
export function coverOnSave(router) {
  return async (req, res, next) => {
    try {
      const book = req.params.id ? router.db.get('books').getById(req.params.id).value() : undefined;
      // 없는 책 수정, 삭제는 router 가 404 로 답하도록 그대로 넘김
      if (req.method !== 'POST' && !book) return next();

      if (req.method === 'DELETE') {
        afterResponse(res, () => removeCover(book.coverImageUrl));
        return next();
      }

      delete req.body.coverThumbnailUrl;

      if (!('coverImageUrl' in req.body)) {
        // PUT (전체 교체) 에서 표지를 안 보냈으면 지금 표지를 유지 (파일만 남는 것 방지)
        if (req.method === 'PUT' && book) {
          req.body.coverImageUrl = book.coverImageUrl ?? null;
          req.body.coverThumbnailUrl = book.coverThumbnailUrl ?? null;
        }
        return next();
      }

      const value = req.body.coverImageUrl;
      const previous = book?.coverImageUrl;

      if (value === null || value === '') {
        req.body.coverImageUrl = null;
        req.body.coverThumbnailUrl = null;
        afterResponse(res, () => removeCover(previous));
        return next();
      }

      if (book && value === previous) {
        req.body.coverThumbnailUrl = book.coverThumbnailUrl ?? null;
        return next();
      }

      if (!isCoverDataUrl(value)) {
        return res.status(400).json({ message: '표지는 새로 만든 이미지만 저장할 수 있습니다.' });
      }

      const saved = await saveCover(value);
      Object.assign(req.body, saved);
      // 성공하면 이전 폴더를, 실패하면 방금 만든 폴더를 지움
      afterResponse(res, () => removeCover(previous), () => removeCover(saved.coverImageUrl));
      return next();
    } catch (e) {
      if (e instanceof CoverError) return res.status(400).json({ message: e.message });
      return next(e);
    }
  };
}
