

// 비밀번호 해시 : scrypt + 사용자마다 다른 salt (Node 내장 crypto)
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

const KEY_LENGTH = 64; // 해시 길이 (바이트)

/**
 * 평문 비밀번호 -> 저장용 문자열 "scrypt$<salt>$<hash>"
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  
  // randomBytes(16) 을 16진수 문자열로
  const salt = randomBytes(16).toString('hex');
  
  // hash : scryptSync(password, salt, KEY_LENGTH) 를 16진수 문자열로
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');

  // `scrypt$${salt}$${hash}` 로 합쳐 반환
  return `scrypt$${salt}$${hash}`;
}

/**
 * 평문 비밀번호가 저장된 해시와 맞는지 확인합니다
 * @param {string} password
 * @param {string} stored  hashPassword 가 만든 문자열
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  // 입력이 문자열이 아니면 (값 없음, 옛 데이터 등) 실패
  if (typeof password !== 'string' || typeof stored !== 'string') return false;

  // stored 를 '$' 로 나눠 방식, salt, hash 꺼내기 (형식이 다르면 실패)
  const [method, salt, hash] = stored.split('$');
  if (method !== 'scrypt' || !salt || !hash) return false;

  // 같은 salt 로 입력한 비밀번호를 다시 해시
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, KEY_LENGTH);

  // 길이가 다르면 timingSafeEqual 이 에러를 던지므로 먼저 확인
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}