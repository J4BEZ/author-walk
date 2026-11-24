
import {isBlank, isLengthBetween, hasInvalidChars, matchesPattern} from "./text.js"

/**
 * 사용자 필드별 글자 수 제한 (예시)
 * author: 2 ~ 15자
 * userId: 2 ~ 15자
 * password: 8 ~ 15자
*/
export const USER_STR_LENGTH_LIMIT = {
  author: { min: 2, max: 15 },
  userId: { min: 2, max: 15 },
  password: { min: 8, max: 15 },
};

const USER_ID_CHARS = /^[a-zA-Z0-9_]+$/; // 영문자, 숫자, 밑줄만 허용


/**
 * 작성자 이름을 검사합니다
 * @param {string} author
 * @returns {string | null}
 */
export function validateAuthor(author) {
  if (isBlank(author)) return '작성자를 입력해 주세요.';
  if (!isLengthBetween(author, USER_STR_LENGTH_LIMIT.author.min, USER_STR_LENGTH_LIMIT.author.max)) return `작성자는 ${USER_STR_LENGTH_LIMIT.author.min}~${USER_STR_LENGTH_LIMIT.author.max}자 사이로 입력해 주세요.`;
  if (hasInvalidChars(author)) return '작성자 이름에 사용할 수 없는 문자가 포함되어 있습니다.';
  return null;
}

/**
 * 사용자 아이디를 검사합니다
 * @param {string} userId
 * @returns {string | null}
 */
export function validateUserId(userId) {
  if (isBlank(userId)) return '아이디를 입력해 주세요.';
  if (!isLengthBetween(userId, USER_STR_LENGTH_LIMIT.userId.min, USER_STR_LENGTH_LIMIT.userId.max)) return `아이디는 ${USER_STR_LENGTH_LIMIT.userId.min}~${USER_STR_LENGTH_LIMIT.userId.max}자 사이로 입력해 주세요.`;
  if (!matchesPattern(userId, USER_ID_CHARS)) return '아이디는 영문자, 숫자, 밑줄만 사용할 수 있습니다.';
  return null;
}


/**
 * 사용자 비밀번호를 검사합니다
 * @param {string} password
 * @returns {string | null}
 */
export function validatePassword(password) {
  if (isBlank(password)) return '비밀번호를 입력해 주세요.';
  if (!isLengthBetween(password, USER_STR_LENGTH_LIMIT.password.min, USER_STR_LENGTH_LIMIT.password.max)) return `비밀번호는 ${USER_STR_LENGTH_LIMIT.password.min}~${USER_STR_LENGTH_LIMIT.password.max}자 사이로 입력해 주세요.`;

  if (!matchesPattern(password, /^[\x21-\x7E]+$/)) return '비밀번호는 영문, 숫자, 특수문자만 사용할 수 있습니다.';

  if (!matchesPattern(password, /[A-Za-z]/)) return '비밀번호에는 최소한 하나의 영문자가 포함되어야 합니다.';
  if (!matchesPattern(password, /[0-9]/)) return '비밀번호에는 최소한 하나의 숫자가 포함되어야 합니다.';
  if (!matchesPattern(password, /[!-/:-@[-`{-~]/)) return '비밀번호에는 최소한 하나의 특수문자가 포함되어야 합니다.';
  return null;
}