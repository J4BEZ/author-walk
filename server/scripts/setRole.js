// 사용자 역할 바꾸기 : 관리자 승격, 보통 사용자 강등 (서버를 돌리는 사람만 실행)
//
//   npm run set-role -- gildong1234 admin   관리자로 승격
//   npm run set-role -- gildong1234 user    보통 사용자로 강등
//
// - 비밀번호는 건드리지 않습니다. 관리자도 먼저 평소처럼 회원가입한 계정이어야 합니다
// - 서버가 켜져 있어도 됩니다 (watchDB 가 db.json 변경을 다시 읽음). role 은 토큰이 아니라 요청마다 users 에서 읽으므로
//   다시 로그인하지 않아도 다음 요청부터 바로 반영됩니다
// - 시험용 : --db <경로> 로 다른 db 파일을 고를 수 있습니다

import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ROLES } from '../utils/roles.js';

const DEFAULT_DB_FILE = fileURLToPath(new URL('../../db.json', import.meta.url));
const USAGE = `사용법 : npm run set-role -- <아이디> <${ROLES.join(' | ')}>`;

/** 안내를 보여 주고 실패로 끝냅니다 */
function fail(message) {
  console.error(message);
  console.error(USAGE);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { db: { type: 'string' } },
});
const [userId, role] = positionals;

if (!userId || !role) fail('아이디와 역할을 모두 적어 주세요.');
if (!ROLES.includes(role)) fail(`알 수 없는 역할 : ${role}`);

const dbFile = values.db ?? DEFAULT_DB_FILE;
const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

const user = data.users?.find((u) => u.userId === userId);
if (!user) fail(`없는 아이디 : ${userId} (먼저 회원가입이 필요합니다)`);

user.role = role;

// json-server (lowdb) 가 저장하는 모양 그대로 (2칸 들여쓰기) 써서 다른 줄은 바뀌지 않게
fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
console.log(`${userId} : ${role} (비밀번호는 그대로)`);
