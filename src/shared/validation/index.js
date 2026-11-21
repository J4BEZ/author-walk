// 입력된 값에 대한 유효성 검사를 수행하는 유틸 함수들 모음

// index.js 가 무엇인가?
// : 해당 폴더의 여러 유틸 함수들을 한 곳에서 모아 export 하는 역할을 합니다.
//   이렇게 하면 import 할 때 경로를 굉장히 간단하게 만들 수 있습니다.

//   예를 들어, ../../shared/validation/text.js, ../../shared/validation/password.js 
// 등 여러 파일을 import 하는 대신 ../../shared/validation 하나만 써도 다 사용할 수 있습니다!!
// (이를 배럴(barrel)이라고 부릅니다)

// 예) import { isBlank, validatePassword } from '../../shared/validation/index.js';
//
// (shared 는 내부에서 features 를 역으로 import 하지 않아야 합니다.)

export { isBlank, countChars, isLengthBetween, matchesPattern } from './text.js';
export { hasTagChars, hasDirectionControls, hasStackedMarks, hasInvalidChars } from './text.js';
export { isImageDataUrl } from './image.js';
