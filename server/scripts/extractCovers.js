// 기존 db.json 의 data URL 표지를 파일 (server/covers/<uuid>/original.png, thumbnail.webp) 로 옮깁니다 (한 번만 실행)
//
// 사용법 : npm run extract-covers                  (프로젝트 루트의 db.json)
//          npm run extract-covers -- --db <경로>    (다른 db.json)
//
// - 실행 전에 같은 폴더에 백업 (<db>.before-covers-<시각>.json) 을 만듭니다
// - 서버가 켜져 있으면 옮기는 동안 다른 저장이 끼지 않도록 잠깐 끄고 실행하는 것을 권장합니다
// - 저장은 서버와 같은 saveCover 를 써서 검사, 파일 이름, 썸네일 크기가 같습니다

import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { CoverError, isCoverDataUrl, saveCover } from '../utils/covers.js';

const DEFAULT_DB_FILE = fileURLToPath(new URL('../../db.json', import.meta.url));

const { values } = parseArgs({ options: { db: { type: 'string' } } });
const dbFile = values.db ?? DEFAULT_DB_FILE;

const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const books = data.books ?? [];
const targets = books.filter((b) => isCoverDataUrl(b.coverImageUrl));

if (targets.length === 0) {
  console.log('옮길 data URL 표지가 없습니다.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = `${dbFile}.before-covers-${stamp}.json`;
fs.copyFileSync(dbFile, backupFile);
console.log(`백업 : ${backupFile}`);

let moved = 0;
for (const book of targets) {
  try {
    Object.assign(book, await saveCover(book.coverImageUrl));
    moved += 1;
    console.log(`  옮김 : ${book.id} ${book.title}`);
  } catch (e) {
    if (!(e instanceof CoverError)) throw e;
    // 읽을 수 없는 표지는 그대로 두고 알려 줌 (화면은 data URL 을 그대로 보여 줌)
    console.log(`  건너뜀 : ${book.id} ${book.title} (${e.message})`);
  }
}

const before = fs.statSync(dbFile).size;
fs.writeFileSync(dbFile, JSON.stringify(data, null, 2) + '\n');
const after = fs.statSync(dbFile).size;

console.log(`표지 ${moved} / ${targets.length} 개 옮김, db.json ${before.toLocaleString()} -> ${after.toLocaleString()} bytes`);
