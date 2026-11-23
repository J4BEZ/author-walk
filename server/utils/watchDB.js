import fs from 'node:fs';

/**
 * DB_FILE 을 감시하여 변경 시 router.db 를 다시 읽도록 설정합니다.
 * @param {string} DB_FILE - 감시할 db.json 파일 경로
 * @param {object} router - json-server 라우터 객체
 */
function watchDB(DB_FILE, router) {
  let reloadTimer;
  fs.watch(DB_FILE, () => {
    // 한 번 저장에 이벤트가 여러 번 올 수 있어서 100ms 모아서 한 번만 읽기
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      try {
        router.db.read(); // 파일 내용을 메모리로 다시 불러오기
      } catch (e) {
        // 고치는 도중이라 JSON 이 깨져 있으면 이전 내용을 유지
        console.error('db.json 을 다시 읽지 못했어요 :', e.message);
      }
    }, 100);
  });
}

export default watchDB;