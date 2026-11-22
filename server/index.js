// json-server 를 모듈로 띄우는 커스텀 서버
// npm run server 로 실행합니다 (주소와 동작은 기존 json-server 와 같음)


import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';
import watchDB from './utils/watchDB.js';


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
watchDB(DB_FILE, router);
