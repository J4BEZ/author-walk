// 로그인 토큰 (JWT) 만들기, 검증하기 : jose 사용
//
// - 서명 방식은 HS256 하나로 고정합니다 (토큰 헤더의 alg 를 믿지 않음 : "alg": "none" 같은 우회 방지)
// - 토큰에는 누구인지 (sub = 로그인 아이디) 와 발급, 만료 시각만 넣습니다
//   role 같은 권한은 넣지 않고 요청마다 users 에서 읽습니다 (권한을 바꿔도 만료 전 토큰에 옛 권한이 남지 않도록)

import { randomBytes } from 'node:crypto';
import process from 'node:process';
import { SignJWT, jwtVerify } from 'jose';

const ALGORITHM = 'HS256';
const TOKEN_TTL = '1h'; // 토큰 유효 시간
const MIN_SECRET_BYTES = 32; // HS256 권장 최소 키 길이 (256비트)

/**
 * 서명 키를 정합니다 : .env 의 JWT_SECRET, 없으면 서버가 켜질 때 임시 키
 * @returns {Uint8Array}
 */
function loadSecret() {
  const fromEnv = process.env.JWT_SECRET;

  if (!fromEnv) {
    console.warn('[auth] JWT_SECRET 이 없어 임시 서명 키를 만듭니다. 서버를 재시작하면 다시 로그인해야 합니다 (.env.example 참고)');
    return randomBytes(MIN_SECRET_BYTES);
  }

  const secret = new TextEncoder().encode(fromEnv);
  if (secret.length < MIN_SECRET_BYTES) {
    console.warn(`[auth] JWT_SECRET 이 ${MIN_SECRET_BYTES} 바이트보다 짧습니다. .env.example 의 만들기 명령으로 새로 만들어 주세요`);
  }
  return secret;
}

const SECRET = loadSecret();

/**
 * 로그인한 user 의 토큰을 만듭니다
 * @param {{ userId: string }} user
 * @returns {Promise<string>}  "header.payload.signature"
 */
export function signToken(user) {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET);
}

/**
 * 토큰을 검증하고 로그인 아이디를 꺼냅니다 (서명이 틀리거나, 만료되었거나, 형식이 이상하면 null)
 * @param {unknown} token
 * @returns {Promise<string | null>}
 */
export async function verifyToken(token) {
  if (typeof token !== 'string' || !token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
