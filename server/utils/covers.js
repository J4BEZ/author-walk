// 표지 파일 : data URL 을 검사해 server/covers/<uuid>/ 에 원본 (png) 과 썸네일 (webp) 로 저장하고, 지웁니다
// 저장 미들웨어 (middlewares/covers.js) 와 옮기기 스크립트 (scripts/extractCovers.js) 가 함께 씁니다

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/** 표지를 저장하는 폴더 (이 폴더만 /covers 로 내보냄) */
export const COVERS_DIR = fileURLToPath(new URL('../covers/', import.meta.url));

/** 화면에 주는 주소의 앞부분 */
export const COVERS_URL_PATH = '/covers';

/** 디코딩한 이미지 크기 제한 (bodyParser 10MB, base64 는 약 1.33배라 7MB 안쪽) */
export const MAX_COVER_BYTES = 7 * 1024 * 1024;

/** 가로 x 세로 픽셀 수 제한 (지금 표지 1024x1536 의 약 10배) */
const MAX_INPUT_PIXELS = 4096 * 4096;

/** 목록 썸네일 : 가로 320px (세로는 비율대로), webp 품질 80 */
const THUMBNAIL = { width: 320, quality: 80 };

/** 서버가 정한 파일 이름 두 개 */
const ORIGINAL_FILE = 'original.png';
const THUMBNAIL_FILE = 'thumbnail.webp';

/** crypto.randomUUID() 모양 (v4, 소문자) */
const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

/** /covers 아래에서 허용하는 주소 : /<uuid>/original.png, /<uuid>/thumbnail.webp 두 모양만 */
export const COVER_FILE_PATH_RE = new RegExp(`^/${UUID_PATTERN}/(original\\.png|thumbnail\\.webp)$`);

/** db.json 의 표지 주소에서 폴더 이름 (uuid) 꺼내기용 */
const COVER_URL_RE = new RegExp(`^${COVERS_URL_PATH}/(${UUID_PATTERN})/(original\\.png|thumbnail\\.webp)$`);

/** 받는 data URL : png, jpeg, webp 의 base64 만 */
const DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/** 디코딩한 바이트의 앞부분 (매직 넘버) 으로 실제 형식 확인 */
const SIGNATURES = {
  png: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  jpeg: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
};

/** 화면에 400 으로 알려 줄 표지 오류 */
export class CoverError extends Error {}

/**
 * data URL 인지 (형식만 보고, 내용 검사는 saveCover 에서)
 * @param {unknown} value
 * @returns {value is string}
 */
export function isCoverDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

/**
 * data URL 을 검사해 바이트로 바꿉니다 (형식 표시, 크기, 매직 넘버)
 * @param {string} dataUrl
 * @returns {Buffer}
 */
function decodeCoverDataUrl(dataUrl) {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) throw new CoverError('표지는 png, jpeg, webp 이미지만 저장할 수 있습니다.');

  const [, type, base64] = match;
  // base64 길이로 먼저 어림해 큰 값은 디코딩 전에 거절
  if (base64.length * 0.75 > MAX_COVER_BYTES + 3) throw new CoverError('표지 이미지가 너무 큽니다.');

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_COVER_BYTES) throw new CoverError('표지 이미지가 너무 큽니다.');
  if (!SIGNATURES[type](bytes)) throw new CoverError('표지 이미지 형식이 올바르지 않습니다.');
  return bytes;
}

/**
 * 표지를 저장하고 두 주소를 돌려줍니다
 * - 폴더 이름은 서버가 만든 무작위 uuid, 파일 이름은 original.png, thumbnail.webp 로 고정
 * - 원본도 png 로 다시 저장 (메타데이터, 뒤에 붙은 데이터 제거, 무손실)
 * @param {string} dataUrl
 * @returns {Promise<{ coverImageUrl: string, coverThumbnailUrl: string }>}
 */
export async function saveCover(dataUrl) {
  const bytes = decodeCoverDataUrl(dataUrl);

  let original;
  let thumbnail;
  try {
    const image = () => sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' });
    const { format } = await image().metadata();
    if (!['png', 'jpeg', 'webp'].includes(format)) throw new CoverError('표지 이미지 형식이 올바르지 않습니다.');

    original = await image().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    thumbnail = await image()
      .resize({ width: THUMBNAIL.width, withoutEnlargement: true })
      .webp({ quality: THUMBNAIL.quality })
      .toBuffer();
  } catch (e) {
    if (e instanceof CoverError) throw e;
    // 깨진 이미지, 픽셀 수 초과 등 sharp 가 읽지 못한 경우
    throw new CoverError('표지 이미지를 읽을 수 없습니다.');
  }

  const id = crypto.randomUUID();
  const dir = path.join(COVERS_DIR, id);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.writeFile(path.join(dir, ORIGINAL_FILE), original);
    await fs.writeFile(path.join(dir, THUMBNAIL_FILE), thumbnail);
  } catch (e) {
    await fs.rm(dir, { recursive: true, force: true });
    throw e;
  }

  return {
    coverImageUrl: `${COVERS_URL_PATH}/${id}/${ORIGINAL_FILE}`,
    coverThumbnailUrl: `${COVERS_URL_PATH}/${id}/${THUMBNAIL_FILE}`,
  };
}

/**
 * 표지 주소가 가리키는 폴더를 지웁니다
 * - 주소가 /covers/<uuid>/... 모양일 때만 (data URL, 이상한 값이면 아무것도 안 함)
 * - 합친 경로가 COVERS_DIR 바로 아래인지 한 번 더 확인
 * @param {unknown} coverUrl  db.json 의 coverImageUrl 또는 coverThumbnailUrl
 * @returns {Promise<boolean>}  지웠으면 true
 */
export async function removeCover(coverUrl) {
  if (typeof coverUrl !== 'string') return false;
  const match = COVER_URL_RE.exec(coverUrl);
  if (!match) return false;

  const dir = path.join(COVERS_DIR, match[1]);
  if (path.dirname(dir) !== path.resolve(COVERS_DIR)) return false;

  await fs.rm(dir, { recursive: true, force: true });
  return true;
}
