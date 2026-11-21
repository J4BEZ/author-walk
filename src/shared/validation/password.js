// 비밀번호 형식 검사 (등록할 때만 사용, 수정 · 삭제 때 본인 확인에는 쓰지 않음)

/**
 * 비밀번호 최소 길이
 * @type {number}
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * 비밀번호 규칙 안내 문구
 * @type {string}
 */
export const PASSWORD_RULE_MESSAGE = '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.';

// 특수문자 : 키보드의 ASCII 기호 (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
const SPECIAL = /[!-/:-@[-`{-~]/;

/**
 * 비밀번호가 규칙에 맞는지 검사합니다
 *
 * 규칙 : 8자 이상, 영문 · 숫자 · 특수문자 각각 1개 이상, 공백 없음
 * @param {string} password
 * @returns {string | null}  통과하면 null, 실패하면 안내 문구
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || password === '') return '비밀번호를 입력해 주세요.';
  if (/\s/.test(password)) return '비밀번호에는 공백을 넣을 수 없습니다.';

  const ok =
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Za-z]/.test(password) && // 영문
    /\d/.test(password) &&       // 숫자
    SPECIAL.test(password);      // 특수문자

  return ok ? null : PASSWORD_RULE_MESSAGE;
}
