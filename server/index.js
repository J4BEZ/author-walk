// json-server 를 모듈로 띄우는 커스텀 서버
// npm run server 로 실행합니다 (주소와 동작은 기존 json-server 와 같음)


import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import jsonServer from 'json-server';

import watchDB from './utils/watchDB.js';
import hideSecrets from './utils/hideSecrets.js';
import { delay } from './middlewares/delay.js';

import { booksRoutes } from './routes/books.js';
import { authRoutes } from './routes/auth.js';



const PORT = 3000;
// 실행 옵션 : node server/index.js --delay 1000 이면 모든 응답을 1초 늦춤 (npm run server-with-delay)
const { values: options } = parseArgs({ options: { delay: { type: 'string', default: '0' } } });
const DELAY_MS = Number(options.delay);
// 실행 위치와 상관없이 프로젝트 루트의 db.json 을 가리키도록
const DB_FILE = fileURLToPath(new URL('../db.json', import.meta.url));



const server = jsonServer.create();

// /books 같은 REST 경로를 만들어 주는 부분
// foreignKeySuffix : json-server 는 기본으로 'xxxId' 필드를 'xxxs' 컬렉션의 id 를 가리키는 외래 키로 봅니다.
// 그래서 DELETE 때마다 가리키는 대상이 없는 문서를 연쇄로 지우는데,
// userId 는 'users' : [] 라는 필드의 id (숫자) 가 아니라 로그인 아이디 (문자열) 라서 책과 users 가 전부 지워집니다.
// 위 사항은 기존 userId에서 users 테이블로 분리되면서 확인된 연쇄 삭제 문제를 방지하기 위한 설정입니다.
// 아무도 쓰지 않는 '_fk' 로 바꿔 이 기능을 끕니다 (_expand, _embed 도 함께 꺼지지만 쓰지 않음)
const router = jsonServer.router(DB_FILE, { foreignKeySuffix: '_fk' });


// router 가 응답을 보내기 직전에 불리는 함수를 바꿔 끼움
router.render = (req, res) => {
  res.jsonp(hideSecrets(res.locals.data));
};


// ** 미들웨어 설정 **
server.use(jsonServer.defaults());   // CORS, 요청 로그, 정적 파일 (기존 json-server 기본 설정)
if (DELAY_MS > 0) server.use(delay(DELAY_MS)); // --delay 를 준 경우에만 응답 늦추기
server.use(jsonServer.bodyParser);   // 요청 본문 JSON -> req.body

// json-server router 안의 methodOverride 가 POST 를 다른 메서드로 바꾸지 못하도록 모든 요청에서 헤더를 지웁니다.
// (POST 로 통과시키고 router 안에서 DELETE, GET 으로 바뀌어 검사를 건너뛰는 우회를 막기 위함)
server.use((req, res, next) => {
  delete req.headers['x-http-method-override'];
  next();
});

server.use('/books', booksRoutes(router)); // 등록, 본인 확인, 좋아요, 수정, 삭제 (routes/books.js)
server.use('/auth', authRoutes(router)); // 회원가입, 로그인 (routes/auth.js)

// [순서 중요]
// 직접 만든 라우트 (/books, /auth) 보다 뒤, json-server router (server.use(router)) 보다 앞에 둡니다.
// 앞에 두면 /books/:id/likes 같은 직접 만든 세 칸 이상 경로까지 막히고, router 뒤에 두면 아무것도 막지 못합니다.
server.use('/:resource/:id/:nested', (_req, res) => res.sendStatus(404));

// 접근 차단
// json-server 의 /db (db.json 전체) 는 아이디, 해시비번이 포함된 민감 정보이므로, 접근 자체가 안되게 합니다.
// GET 만 막으면 다른 메서드로 들어와 router 의 /db 에 닿을 수 있어 모든 메서드를 막습니다.
server.use('/db', (req, res) => res.sendStatus(404));

// 유저 전체 정보는 접근 할 수 없도록 막음
// db.json 내 등록된 'users' 필드가 라우팅되는 걸(주소로 접근할 수 있도록 경로가 만들어지는 걸) 막기 위함입니다.
// 서버는 router.db.get('users') 처럼 db.json을 직접 읽도록 구현되어 있어서 괜찮아요
server.use('/users', (req, res) => res.sendStatus(404));

// ** 미들웨어 설정 끝 **

// db.json 손으로 수정해도 반영되도록 감시
watchDB(DB_FILE, router);
server.use(router);


server.listen(PORT, () => {
  console.log(`커스텀 json-server : http://localhost:${PORT}${DELAY_MS > 0 ? ` (응답 ${DELAY_MS}ms 지연)` : ''}`);
});

