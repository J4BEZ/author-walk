// 도서 기능에서 쓰는 타입 모음 (JSDoc, 편집기 자동완성용입니다.)
// Python의 타입 힌팅과 비슷한 기능으로 보시면 됩니다!

/**
 * json-server 에 저장되는 도서 한 권
 * @typedef {object} Book
 * @property {number} id                    json-server 가 자동으로 붙이는 번호
 * @property {string} title                 제목
 * @property {string} author                작성자 (수정, 삭제 확인에도 사용)
 * @property {string} description           작품 소개 (목록, 상세에 보여 줄 짧은 소개)
 * @property {string} content               본문 (AI 표지 프롬프트에도 사용)
 * @property {string | null} userId         작성한 사용자 아이디 (임시, users 생기기 전까지 null 가능)
 * @property {string} passwordHash          비밀번호의 SHA-256 해시 (화면에는 넘기지 않음)
 * @property {string | null} coverImageUrl  표지 Data URL (`data:image/png;base64,...`), 아직 없으면 null
 * @property {string} createdAt             등록 시각 (ISO 문자열)
 * @property {string} updatedAt             수정 시각 (ISO 문자열)
 */

/**
 * 화면에서 쓰는 도서 (passwordHash 를 뺀 모양)
 *
 * `Omit<원래 타입, '뺄 필드'>` 는 원래 타입에서 일부 필드만 뺀 새 타입을 만듭니다.
 * 여기서는 Book 에서 passwordHash 만 빼서, 화면 코드가 해시를 실수로 쓰지 못하게 합니다.
 * @typedef {Omit<Book, 'passwordHash'>} BookView
 */

/**
 * 새 도서 등록 폼에서 넘기는 값
 * @typedef {object} NewBookInput
 * @property {string} title                    제목 (필수, 공백만은 안 됨)
 * @property {string} author                   작성자 (필수, 수정과 삭제 때 본인 확인에 사용)
 * @property {string} content                  본문 (필수, AI 표지 프롬프트에 사용)
 * @property {string} [description]            작품 소개 (없으면 빈 문자열로 저장)
 * @property {string | null} [userId]          사용자 아이디 (임시, 없으면 null)
 * @property {string} password                 평문 비밀번호 (booksApi 가 해시한 뒤 저장, 평문은 저장하지 않음)
 * @property {string | null} [coverImageUrl]   등록하면서 바로 만든 표지 Data URL (없으면 생략, null 로 저장)
 */

/**
 * 수정할 때 넘기는 값 (바뀐 필드만)
 *
 * `Pick<Book, '필드' | '필드'>` 는 Book 에서 고른 필드만 남긴 타입,
 * `Partial<...>` 는 그 필드들을 모두 "있어도 되고 없어도 되는" 선택 필드로 바꾼 타입입니다.
 * `{ title }` 만 보내도, `{ coverImageUrl }` 만 보내도 됩니다 (PATCH 는 바뀐 필드만).
 * @typedef {Partial<Pick<Book, 'title' | 'description' | 'content' | 'coverImageUrl'>>} BookChanges
 */

/**
 * 수정, 삭제 전에 본인 확인용으로 입력받는 값
 * @typedef {object} Credentials
 * @property {string} author    작성자 (글을 쓸 때 입력한 이름)
 * @property {string} password  평문 비밀번호 (비교할 때만 해시, 저장하지 않음)
 */

export {};
