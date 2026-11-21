
# 폴더 구조 설계와 import 규칙

---

## 1. 폴더 구조 예시

- 폴더 구조는 기본적으로 기능(feature) 별로 관심사를 분리하는 [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) 구조를 기준으로 삼았습니다.

- 아래는 예시 입니다.   
  (필요에 따라 적절히 변동될 수 있습니다.)

```
src/
  App.jsx, main.jsx
  components/                  공용 컴포넌트
  ...                          (모든 페이지에 동일하게 사용 될 Header, Footer 등)
  features/                    feature 별 폴더
    books/                     책 (작품) 관련 feature
      api/booksApi.js          json-server 와 통신 (fetch 는 여기에만)
      hooks/useBooks.js        React State 와 booksApi 를 잇는 훅
      utils/bookValidation.js  입력 규칙 (순수 함수)
      types.js                 데이터 모양 (JSDoc 타입)
      components/              책 화면 부품 (UI 컴포넌트)
      ...
    OpenAI_Integration/        OpenAI 생성 관련 feature
      ...
  utils/                       여러 feature 가 함께 쓰는 순수 함수
    validation/                판단 함수 (true / false)
    processing/                값 다듬기 함수
  examples/                    함수 사용 예제 (실제 화면 아님)
```

---

## 2. 코드별 위치

처음에는 feature 안에 두고, **두 번째 feature 가 쓰게 되면**(즉, 해당 함수 또는 컴포넌트를 두 곳 이상 공유하게 될 경우) 공용 위치로 올립니다.

### 2-1. feature 안 (한 feature 에서만 쓰는 경우)

| 파일 | 위치 |
| --- | --- |
| 서버에 요청하는 함수 | `src/features/<feature>/api/` |
| State 를 다루는 훅 | `src/features/<feature>/hooks/` |
| 규칙, 계산 (순수 함수) | `src/features/<feature>/utils/` |
| 화면 부품 (UI 컴포넌트) | `src/features/<feature>/components/` |
| 데이터 모양 (JSDoc 타입) | `src/features/<feature>/types.js` |

### 2-2. 공용 (두 개 이상의 feature 가 쓰는 경우)

| 파일 | 위치 |
| --- | --- |
| 서버에 요청하는 공용 함수 | `src/api/` |
| 공통으로 사용되는 화면 부품 (Header, Footer 등) | `src/components/` |
| State 를 다루는 훅 | `src/hooks/` |
| 규칙, 계산 (순수 함수) | `src/utils/` |

공용 폴더는 필요해질 때 만듭니다.

---

## 3. import 규칙

### 3-1. 경로 

|  | 권장 import 경로 | 예 |
| --- | --- | --- |
| 같은 feature 안 import | 상대 경로 | `'../api/booksApi.js'` |
| 공용 `src/utils/` import | `#src/utils` | `'#src/utils/validation/text.js'` |

```js
import { isBlank } from '#src/utils/validation/text.js';           // 공용 유틸
import { getBooks } from '../api/booksApi.js';                     // 같은 feature 안
```

- `#src/` 는 `src/` 폴더를 뜻합니다.   



### 3-2. 파일을 직접 import (index.js 묶음 없음)

```js
// 권장 (해당 함수가 있는 파일을 직접 import)
import { isBlank } from '#src/utils/validation/text.js';
import { isImageDataUrl } from '#src/utils/validation/image.js';

// 비권장 : 배럴 파일(index.js) 로 묶어서 내보내기
import { isBlank, isImageDataUrl } from '#src/utils/validation/index.js';
```

- 배럴 파일에서 하나만 import 해도 묶인 파일을 모두 불러와서 개발 서버가 느려지기 때문에 공식 문서에서 사용을 지양하고 있습니다. ([Vite 성능 가이드](https://vite.dev/guide/performance#avoid-barrel-files))

### 3-3. 참조 방향

```
src/utils  ->  features/*  ->  App.jsx
```

- `features` 끼리는 서로의 함수, 변수를 직접 import 하지 않습니다.
- `src/utils/` 는 `features/` 를 import 하지 않습니다.
- 두 feature 를 함께 써야 하면 **App.jsx (또는 화면)** 에서 합칩니다.

```jsx
// 비권장 예시: feature 안에서 다른 feature 를 직접 import 하여 사용하기
// src/features/sample-feature/SampleComponent.jsx
import { getBook } from '../books/api/booksApi.js';

// 권장 예시: 다른 feature 의 함수를 props (또는 인자) 로 넘겨받고, App.jsx 에서 조립하기

// OpenAI_Integration feature 안에서 books feature 를 직접 import 하는 대신
// `onSave` 로 자리를 만들고, App.jsx 에서 `changeCover` 를 연결하는 예제

// src/features/OpenAI_Integration/useBookCoverGenerator.js
export function useBookCoverGenerator({ book, onSave }) {
  // ...
  await onSave(cover);
}

// App.jsx 가 두 feature 를 연결
const handleCover = async (dataUrl) => {
  setBook(await changeCover(book.id, dataUrl));
};
<BookCoverGenerator book={book} onSave={handleCover} />  // OpenAI_Integration feature 의 컴포넌트
```

> JSDoc 타입 (`/** @import { BookView } from '../books/types.js' */`) 은 주석이라 동작에 영향이 없어서 예외로 둡니다.   
> 타입 힌트의 경우 코드의 흐름을 파악하기 더 용이하기 때문에 권장 합니다.

### 3-4. `utils/` 에는 순수 함수만

`utils/` 안의 파일은 **React, fetch, `import.meta.env` 를 쓰지 않습니다.**   
이렇게 하면 같은 규칙을 화면에서도, 나중에 서버 (Node) 에서도 그대로 쓸 수 있습니다.

| 폴더 | React | fetch / `import.meta.env` |
| --- | --- | --- |
| `utils/` | X | X |
| `api/` | X | O |
| `hooks/` | O | X (api 를 통해서) |

---

## 4. 이름 규칙

### 4-1. 함수, 변수

| 접두어 | 반환값 | 예 |
| --- | --- | --- |
| `is`, `has` | `true` / `false` | `isBlank`, `hasInvalidChars` |
| `validate` | 통과하면 `null`, 아니면 안내 문구 | `validateBookTitle` |
| `count`, `remove`, `normalize` | 계산하거나 다듬은 값 | `countChars`, `normalizeBookInput` |
| `get`, `create`, `update`, `delete` | 서버 데이터 | `getBooks`, `createBook` |
| `use` | 훅 | `useBookList`, `useBookDetail` |

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 고정값 | UPPER_SNAKE_CASE | `BOOK_STR_LENGTH_LIMIT`, `TIMEOUT_MS` |
| 객체, 인스턴스 | camelCase | `graphemeSegmenter` |

---

## 5. Deprecated 경로, 이름 (하위 호환)

다른 브랜치의 코드가 깨지지 않도록 잠시 남겨 두었습니다.   
**main 머지 때 삭제 예정** 이니 새 이름으로 바꿔 주세요.

| 옛 것 | 새 것 |
| --- | --- |
| `features/books/booksApi.js` | `features/books/api/booksApi.js` |
| `features/books/useBooks.js` | `features/books/hooks/useBooks.js` |
| `useBooks()` | `useBookList()` |
| `useBook(id)` | `useBookDetail(id)` |

---

## 6. 참고 자료

- [Bulletproof React : Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) : 기준 구조
- [React FAQ : File Structure](https://legacy.reactjs.org/docs/faq-structure.html) : feature 별 묶기, 중첩은 3~4단계까지
- [Robin Wieruch : React Folder Structure](https://www.robinwieruch.de/react-folder-structure/) : 프로젝트가 커질 때 단계별로 나누는 법
- [Vite : 배럴 파일 피하기](https://vite.dev/guide/performance#avoid-barrel-files)
- [Vite : resolve.alias 와 package.json imports](https://vite.dev/config/shared-options#resolve-alias)
- [Node.js : Subpath imports](https://nodejs.org/api/packages.html#subpath-imports) : `#src` 의 원리
- [Bulletproof React 번역 (우리 문서)](bulletproof-project-structure.ko.md) : 기준 구조 원문을 한국어로 옮긴 것
