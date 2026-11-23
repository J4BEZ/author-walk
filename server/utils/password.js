// 비밀번호 해시 : Argon2id + 사용자마다 다른 salt (Node 24.7+ 내장 crypto)
import { argon2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

// OWASP 최소 권장 설정 : 메모리 19MiB, 반복 2회, 병렬 1
// 설정을 올려도 저장 문자열에 옛 설정이 남아 있어 기존 해시는 그대로 확인됩니다
const ARGON2_OPTIONS = { memory: 19456, passes: 2, parallelism: 1 };
const TAG_LENGTH = 32; // 해시 길이 (바이트)

/**
 * 설정 -> 저장 문자열에 넣을 표기 ("m=19456,t=2,p=1")
 * @param {{ memory: number, passes: number, parallelism: number }} options
 * @returns {string}
 */
function toParams({ memory, passes, parallelism }) {
  return `m=${memory},t=${passes},p=${parallelism}`;
}

/**
 * 저장 문자열의 설정 표기 -> 설정 ("m=19456,t=2,p=1" -> { memory: 19456, passes: 2, parallelism: 1 })
 * @param {string} text
 * @returns {{ memory: number, passes: number, parallelism: number }}
 */
function fromParams(text) {
  const map = Object.fromEntries(text.split(',').map((pair) => pair.split('=')));
  return { memory: Number(map.m), passes: Number(map.t), parallelism: Number(map.p) };
}

/**
 * salt 와 설정으로 비밀번호 해시 (Buffer) 를 만듭니다 (hashPassword, verifyPassword 공통)
 * @param {string} password
 * @param {string} salt  16진수 문자열
 * @param {{ memory: number, passes: number, parallelism: number }} [options]
 * @returns {Buffer}
 */
function derive(password, salt, options = ARGON2_OPTIONS) {
  return argon2Sync('argon2id', { message: password, nonce: salt, tagLength: TAG_LENGTH, ...options });
}

/**
 * 평문 비밀번호 -> 저장용 문자열 "argon2id$m=19456,t=2,p=1$<salt>$<hash>"
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  // 사용자마다 다른 salt (16바이트 -> 16진수 문자열)
  const salt = randomBytes(16).toString('hex');

  // 방식, 설정, salt, 해시를 한 문자열로
  return `argon2id$${toParams(ARGON2_OPTIONS)}$${salt}$${derive(password, salt).toString('hex')}`;
}

/**
 * 평문 비밀번호가 저장된 해시와 맞는지 확인합니다 (어떤 입력이든 true / false)
 * @param {string} password
 * @param {string} stored  hashPassword 가 만든 문자열
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  // 입력이 문자열이 아니면 (값 없음, 옛 데이터 등) 실패
  if (typeof password !== 'string' || typeof stored !== 'string') return false;

  // stored 를 '$' 로 나눠 방식, 설정, salt, hash 꺼내기 (형식이 다르면 실패)
  const [method, params, salt, hash] = stored.split('$');
  if (method !== 'argon2id' || !params || !salt || !hash) return false;

  try {
    // 저장된 설정과 salt 로 입력한 비밀번호를 다시 해시
    const expected = Buffer.from(hash, 'hex');
    const actual = derive(password, salt, fromParams(params));

    // 길이가 다르면 timingSafeEqual 이 에러를 던지므로 먼저 확인
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    // salt 가 너무 짧거나 설정 표기가 망가지면 argon2Sync 가 에러를 던짐 -> 실패로 처리
    return false;
  }
}
