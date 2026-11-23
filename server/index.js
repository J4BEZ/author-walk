// json-server 를 모듈로 띄우는 커스텀 서버
// npm run server 로 실행합니다 (주소와 동작은 기존 json-server 와 같음)


import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import jsonServer from 'json-server';

import watchDB from './utils/watchDB.js';
import hideSecrets from './utils/hideSecrets.js';
import { hashOnCreate, requireOwner, verifyOwnerRoute } from './middlewares/owner.js';
import { delay } from './middlewares/delay.js';


const PORT = 3000;
// 실행 옵션 : node server/index.js --delay 1000 이면 모든 응답을 1초 늦춤 (npm run server-with-delay)
const { values: options } = parseArgs({ options: { delay: { type: 'string', default: '0' } } });
const DELAY_MS = Number(options.delay);
// 실행 위치와 상관없이 프로젝트 루트의 db.json 을 가리키도록
const DB_FILE = fileURLToPath(new URL('../db.json', import.meta.url));



const server = jsonServer.create();

// /books 같은 REST 경로를 만들어 주는 부분
const router = jsonServer.router(DB_FILE);


// router 가 응답을 보내기 직전에 불리는 함수를 바꿔 끼움
router.render = (req, res) => {
  res.jsonp(hideSecrets(res.locals.data));
};


// ** 미들웨어 설정 **
server.use(jsonServer.defaults());   // CORS, 요청 로그, 정적 파일 (기존 json-server 기본 설정)
if (DELAY_MS > 0) server.use(delay(DELAY_MS)); // --delay 를 준 경우에만 응답 늦추기
server.use(jsonServer.bodyParser);   // 요청 본문 JSON -> req.body

server.post('/books/:id/verify', verifyOwnerRoute(router)); // 본인 확인 전용 경로
server.post('/books', hashOnCreate);                        // 등록 : 평문 -> 해시
server.use('/books/:id', requireOwner(router));             // 수정, 삭제 : 본인만

// json-server 의 /db (db.json 전체) 는 아이디, 해시비번이 포함된 민감 정보이므로, 접근 자체가 안되게 합니다.
server.get('/db', (req, res) => res.sendStatus(404));

// ** 미들웨어 설정 끝 **

// db.json 손으로 수정해도 반영되도록 감시
watchDB(DB_FILE, router);
server.use(router);


server.listen(PORT, () => {
  console.log(`커스텀 json-server : http://localhost:${PORT}${DELAY_MS > 0 ? ` (응답 ${DELAY_MS}ms 지연)` : ''}`);
});

