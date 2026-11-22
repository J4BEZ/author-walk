

// 응답에서 숨길 필드 목록
export const HIDDEN_FIELDS = ['passwordHash'];


/**
 * 응답에서 숨길 필드를 뺍니다 (책 한 권이든 목록이든)
 * @param {unknown} data
 * @param {string[]} [fields]  뺄 필드 이름들 (기본 HIDDEN_FIELDS)
 * @returns {unknown}
 * @example
 * hideSecrets(book);                            // passwordHash 를 뺀 책
 * hideSecrets(books, ['passwordHash', 'userId']); // 목록에서 두 필드를 모두 뺌
 */
export function hideSecrets(data, fields = HIDDEN_FIELDS) {
  // 배열이면 각 항목에 같은 fields 로 적용
  if (Array.isArray(data)) return data.map((item) => hideSecrets(item, fields));

  
  // 객체이면 숨길 필드만 떼고 나머지 속성들을 조합해서 반환
  // 객체의 각 속성에 대해 재귀적으로 hideSecrets 를 적용
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => !fields.includes(key))
      .map(([key, value]) => [key, hideSecrets(value, fields)]),
    );
  }

  // 그 밖의 값 (빈 응답 등) 은 그대로
  return data;
}


export default hideSecrets;