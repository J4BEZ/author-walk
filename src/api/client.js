// json-server 공통 요청 : 주소, 시간 제한, JSON 변환, 실패 응답 해석
// 여러 feature (books, auth) 가 함께 씁니다. 화면에 맞게 에러를 바꾸는 일은 각 feature 의 api 에서 합니다.

// 서버 주소 : .env 의 VITE_API_URL, 없으면 로컬 json-server
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
// 응답이 이 시간 안에 안 오면 포기 (TimeoutError). 터널 서버가 느릴 때가 있어 30초
const TIMEOUT_MS = 30_000;

/**
 * @typedef {object} RequestOptions request 옵션을 담은 객체
 * @property {string} [method]  기본 'GET',  |  'POST', 'PATCH', 'DELETE' 등 HTTP 메서드
 * @property {object} [body]  있으면 JSON 으로 바꿔 보냄
 * @property {string | null} [token]  있으면 Authorization: Bearer 헤더로 보냄
 */

/**
 * 서버에 요청하고 응답 본문을 객체로 돌려줍니다
 *
 * 실패 응답 (400, 401, 404 ...) 이면 서버가 보낸 본문을 읽어 에러에 담아 던집니다
 * - message : 본문의 message (없으면 '요청 실패 (상태 코드)')
 * - cause : { status, errors } (errors 는 칸별 메시지, 예 : { userId: '...' })
 *
 * 시간 초과 (TimeoutError) 와 네트워크 끊김 (TypeError) 은 cause 없이 그대로 던져집니다
 *
 * @param {string} path  `/books` 처럼 BASE_URL 뒤에 붙는 경로
 * @param {RequestOptions} [options]
 * @returns {Promise<any>}
 */
export async function request(path, { method = 'GET', body, token } = {}) {
  /** @type {Record<string, string>} */
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // 404, 500 같은 실패는 fetch 가 에러로 안 던지므로 직접 확인
  if (!res.ok) {
    const data = await readJsonOrNull(res);
    throw new Error(data?.message ?? `요청 실패 (${res.status})`, {
      cause: { status: res.status, errors: data?.errors },
    });
  }

  return res.json();
}

/**
 * 실패한 HTTP 상태 코드에 따라 에러를 바꿔 던지는 request 를 만듭니다
 * 화면이 알아보는 에러 모양이 feature 마다 다를 때, 매핑 표만 넘겨 씁니다
 * 표에 없는 상태나 상태가 없는 에러 (네트워크 끊김, 시간 초과) 는 그대로 던집니다
 *
 * @param {Record<number, (error: Error) => Error>} statusMap  상태 코드 -> 바꿔 던질 에러를 만드는 함수
 * @returns {typeof request}  request 와 인자, 반환값이 같은 함수
 *
 * @example
 * const request = createRequest({
 *   403: () => new Error('권한이 없습니다', { cause: 'NOT_OWNER' }),
 * });
 */
export function createRequest(statusMap) {
  return withStatusMap(request, statusMap);
}

/**
 * 요청 함수를 감싸, 실패한 HTTP 상태 코드에 따라 에러를 바꿔 던집니다
 *
 * @template {unknown[]} A
 * @template R
 * @param {(...args: A) => Promise<R>} fn  감쌀 요청 함수 (실패하면 error.cause.status 에 상태 코드를 담아 던져야 함)
 * @param {Record<number, (error: Error) => Error>} statusMap  상태 코드 -> 바꿔 던질 에러를 만드는 함수
 * @returns {(...args: A) => Promise<R>}  fn 과 인자, 반환값이 같은 함수
 */
function withStatusMap(fn, statusMap) {
  return async (...args) => {
    try {
      return await fn(...args); // await 필수 : 없으면 실패가 catch 를 지나쳐 감
    } catch (e) {
      const toError = statusMap[e.cause?.status];
      throw toError ? toError(e) : e;
    }
  };
}

/**
 * 본문을 JSON 으로 읽되, JSON 이 아니면 (예 : 'Not Found' 글자) null
 * @param {Response} res
 */
async function readJsonOrNull(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
