// 이미지 값 검사

/**
 * 이미지 Data URL (`data:image/png;base64,...` 등) 인지 확인합니다
 * @param {unknown} value
 * @returns {boolean}
 */
export function isImageDataUrl(value) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}
