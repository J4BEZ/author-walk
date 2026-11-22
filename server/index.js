// json-server 를 모듈로 띄우는 커스텀 서버
// npm run server 로 실행합니다 (주소와 동작은 기존 json-server 와 같음)


import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';
import fs from 'node:fs';


const PORT = 3000;
// 실행 위치와 상관없이 프로젝트 루트의 db.json 을 가리키도록
const DB_FILE = fileURLToPath(new URL('../db.json', import.meta.url));



const server = jsonServer.create();

// /books 같은 REST 경로를 만들어 주는 부분
const router = jsonServer.router(DB_FILE); 

server.use(jsonServer.defaults());   // CORS, 요청 로그, 정적 파일 (기존 json-server 기본 설정)
server.use(jsonServer.bodyParser);   // 요청 본문 JSON -> req.body



server.use(router);
server.listen(PORT, () => {
  console.log(`커스텀 json-server : http://localhost:${PORT}`);
});



// db.json 을 손으로 고쳐도 반영되도록 감시 (json-server 의 --watch 대신)
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