
/**
 * 책 관련 유효성 검사 함수 모음
 * 책 제목, 내용, 작품 소개 ... 등 책 관련 정보의 유효성을 검사하는 함수들을 포함합니다.
 */


/** @import { NewBookInput, BookChanges } from './types.js' */
import { isBlank, isLengthBetween, matchesPattern } from '#src/utils/validation/text.js';
import { hasInvalidChars } from '#src/utils/validation/text.js';

import { removeZeroWidthChars } from '#src/utils/processing/text.js';


/**
 * 책 필드별 글자 수 제한 (예시)
 * title: 1 ~ 100자
 * description: 1 ~ 500자
*/
export const BOOK_STR_LENGTH_LIMIT = {
  title: { min: 1, max: 100 },
  description: { min: 1, max: 500 },
};


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


//# region <- 이거 붙여서 쓰면, vscode에서 볼 때 코드 영역 나누기, 접기/펼치기 가능해요

//#region 작품 관련
/**
 * 작품 제목을 검사합니다
 * 
 * 제목이 비어있거나 글자 수가 제한을 벗어나면 안내 문구를 반환합니다
 * @param {string} title
 * @returns {string | null} 통과하면 null, 아니면 안내 문구 반환
 */
export function validateBookTitle(title) {

    if (isBlank(title)) return '작품 제목을 입력해주세요';
    if (!isLengthBetween(title, BOOK_STR_LENGTH_LIMIT.title.min, BOOK_STR_LENGTH_LIMIT.title.max)) {
        return `작품 제목은 ${BOOK_STR_LENGTH_LIMIT.title.min}~${BOOK_STR_LENGTH_LIMIT.title.max}자여야 합니다`;
    }
    if (hasInvalidChars(title)) return '작품 제목에 사용할 수 없는 문자가 포함되어 있습니다.';

    return null;
}


/** 
 * 작품 소개를 검사합니다.
 * 
 * 글자 수가 제한을 벗어나면 안내 문구를 반환합니다
 * @param {string} description
 * @returns {string | null}
 */
export function validateBookDescription(description) {
  if (!isLengthBetween(description, BOOK_STR_LENGTH_LIMIT.description.min, BOOK_STR_LENGTH_LIMIT.description.max)) return `작품 소개는 ${BOOK_STR_LENGTH_LIMIT.description.min}~${BOOK_STR_LENGTH_LIMIT.description.max}자 사이로 입력해 주세요.`;
  if (hasInvalidChars(description)) return '작품 소개에 사용할 수 없는 문자가 포함되어 있습니다.';
  return null;
}


/**
 * 작품 내용을 검사합니다
 * 
 * (작품 내용 같은 경우에는 별도로 제한을 두지 않았습니다!
 *  이 부분은 향후 회의가 필요할 것 같아요!)
 * @param {string} content
 * @returns {string | null}
 */
export function validateBookContent(content) {
  if (isBlank(content)) return '내용을 입력해 주세요.';
  if (hasInvalidChars(content)) return '작품 내용에 사용할 수 없는 문자가 포함되어 있습니다.';
  return null;
}
//#endregion


//#region 본인 확인용
// 향후 users가 도입될 시 features/users (가명)/userValidation 모듈로 이동 예정입니다.
// 지금은 작품 등록시 함께 사용되나,
// 추후 회원 가입, 내 정보 수정 등에 이용될 수 있습니다.


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

const USER_ID_CHARS = /^[a-zA-Z0-9_]+$/; // 영문자, 숫자, 밑줄만 허용

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

//#endregion


//#region 최종 검증
// 용도: 최종적으로 '등록하기' 버튼을 눌렀을 때 한번 더 검증합니다.

/** 필드 이름: 검사 함수 객체*/
export const BOOK_FIELD_VALIDATORS = {
  title: validateBookTitle,
  author: validateAuthor,
  description: validateBookDescription,
  content: validateBookContent,
  userId: validateUserId,
  password: validatePassword,
};


// Record<string, string> 은 키가 문자열이고 값이 문자열인 객체를 의미합니다.
// python에서 타입 힌팅을 줄 때 dict[str, str]과 유사해요

/**
 * 등록할 값을 모두 검사합니다
 * @param {NewBookInput} input
 * @returns {Record<string, string>} 필드 -> 안내 문구, 비어 있으면 통과
 */
export function validateNewBook(input) {
  
  const errors = {};

  // Object.entries()는 python의 dict.items()와 유사합니다.
  // 즉 for field, validate in BOOK_FIELD_VALIDATORS.items() 와 유사합니다.
  for (const [field, validate] of Object.entries(BOOK_FIELD_VALIDATORS)) {

    // 각 필드에 대해 검증 함수를 호출하고, 메시지가 있으면 errors 객체에 추가합니다.
    // ?? 은 python의 input.get(field, '')와 유사합니다.
    const message = validate(input[field] ?? '');
    if (message) errors[field] = message;
  }
  return errors;
}


/** 수정할 수 있는 필드 (본인 확인 값은 바꾸지 않음) */
const EDITABLE_FIELDS = ['title', 'description', 'content'];

/**
 * 수정할 값을 검사합니다. 보낸 필드만 검사
 * @param {BookChanges} changes
 * @returns {Record<string, string>} 필드 -> 안내 문구, 비어 있으면 통과
 */
export function validateBookChanges(changes) {
  /** @type {Record<string, string>} */
  const errors = {};
  for (const field of EDITABLE_FIELDS) {
    if (!(field in changes)) continue; // 바꾸지 않는 필드는 건너뜀
    const message = BOOK_FIELD_VALIDATORS[field](changes[field] ?? '');
    if (message) errors[field] = message;
  }
  return errors;
}


//#region 입력 다듬기
// 책 제목, 작성자, 사용자 아이디 등 입력값에서 불필요한 제로 폭 문자 제거

/**
 * 등록, 수정할 값을 다듬습니다 : 폭 없는 공백 지우기, 한 줄 칸은 앞뒤 공백 제거
 * 반드시 유효성 검사 이전에 호출하여, 다듬은 값으로 검사 및 등록을 진행해야 합니다.
 * @param {Record<string, string>} input
 * @returns {Record<string, string>} 다듬은 새 객체 (원본은 그대로)
 */
export function normalizeBookInput(input) {
  const result = { ...input };
  for (const [key, value] of Object.entries(result)) {
    
    // 비밀번호는 그대로
    // 사용자가 입력한 그대로 해시해야 다음에 같은 값을 넣었을 때 맞습니다.
    // (어차피 아스키 문자만 들어오므로 제로 폭 문자 제거와 무관, 혹여라도 정책에 따라 기존 값이 바뀌지 않도록 그대로)
    if (typeof value !== 'string' || key === 'password') continue; 
    
    result[key] = removeZeroWidthChars(value);
  }
  for (const key of ['title', 'author', 'userId']) {
    if (typeof result[key] === 'string') result[key] = result[key].trim();
  }
  return result;
}

//#endregion