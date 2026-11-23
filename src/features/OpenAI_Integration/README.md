# OpenAI 컴포넌트 사용 요약

각 컴포넌트를 사용할 화면에서 해당 JSX 파일을 직접 import합니다. 사용자 API 키로 브라우저에서 요청하며 실제 API 요금이 발생합니다.

## 1. 전문 기반 표지 생성 — BookCoverGenerator.jsx

책의 `title`, `author`, `content`를 보내 표지를 생성합니다. 컴포넌트 안에서 API 키·품질 입력 → 생성 → 미리보기 → 저장 순으로 사용합니다.

```jsx
<BookCoverGenerator
  key={JSON.stringify([book.id, book.title, book.author, book.content])}
  book={book}
  onSave={saveCover}
/>
```

- `book`: 제목·작성자·전문이 있는 작품 객체.
- `onSave(dataUrl)`: 부모가 제공하는 비동기 저장 함수. 실패하면 오류를 다시 던져야 합니다.
- 연결 파일: `useBookCoverGenerator.js`, `openaiImageApi.js`.

## 2. 장르·소개글·표지용 요약 분석 — BookAnalysis.jsx

전문을 한 번 보내 아래 결과를 함께 받습니다. API 키 입력 → 분석 → 결과 확인·수정 → JSON 확인 순으로 사용합니다.

| 반환 필드 | 용도 | 최대 길이 |
| --- | --- | --- |
| `genre` | 예상 장르 | 100자 |
| `introduction` | 독자용 소개글. 결말·반전 제외 | 500자 |
| `summary` | 표지용 배경·인물 관계·분위기·시각적 소재. 결말 소재 포함 가능 | 2,000자 |
| `warnings` | 악의적인 지시 등 의심 내용에 대한 참고 안내 | 5개, 각 300자 |

```jsx
<BookAnalysis
  key={JSON.stringify([book.id, book.title, book.author, book.content])}
  book={book}
  onSaveCover={saveCover}
/>
```

- `book`: `id`, `title`, `author`, `content`가 있는 작품 객체.
- `onSaveCover(dataUrl)`: 선택 사항. 전달하면 내장된 요약 기반 생성기에 저장 버튼이 표시됩니다.
- 분석 결과는 화면 상태로만 유지하며 DB에 저장하지 않습니다. 결과를 부모로 전달하는 콜백은 아직 없습니다.
- 연결 파일: `useBookAnalysis.js`, `openaiBookAnalysisApi.js`. 분석 모델은 `gpt-4.1-mini`입니다.

## 3. 장르·요약 기반 표지 생성 — SummaryBookCoverGenerator.jsx

`BookAnalysis` 하단에 이미 포함되어 있습니다. 분석 결과의 장르·표지용 요약을 확인·수정한 뒤 품질 선택 → 생성 → 미리보기 → 저장 순으로 사용하며, 위에 입력한 API 키를 공유합니다.

별도 화면에서 사용할 때는 다음처럼 연결합니다.

```jsx
<SummaryBookCoverGenerator
  key={JSON.stringify([book.id, book.title, book.author, genre, summary])}
  title={book.title}
  author={book.author}
  genre={genre}
  summary={summary}
  userApiKey={userApiKey}
  disabled={false}
  onSave={saveCover}
/>
```

- 필수 입력: 제목·작성자·장르·표지용 요약·사용자 API 키. 전문과 독자용 소개글은 보내지 않습니다.
- `disabled`: 선택 사항. 부모 작업 중 생성·저장 버튼을 잠글 때 사용합니다.
- `onSave(dataUrl)`: 선택 사항. 생략하면 생성·미리보기만 제공합니다.
- 연결 파일: `useSummaryBookCoverGenerator.js`, `openaiSummaryImageApi.js`.

## 공통 연결 시 주의점

- `saveCover`는 부모에서 구현합니다. 예: `async (dataUrl) => setBook(await changeCover(book.id, dataUrl, credentials))`. 현재 App은 기존 도서 API로 본인 확인 후 저장하며 작품 표지가 교체됩니다.
- 두 표지 생성 방식은 `gpt-image-2`를 사용하고, Base64 응답을 `data:image/png;base64,...`로 반환합니다. 이 문자열을 이미지 `src`나 기존 `coverImageUrl` 저장에 사용합니다.
- 작품 정보가 바뀔 때 `key`를 변경해 이전 상태와 생성 요청을 정리합니다. 요약 기반 생성은 장르·요약을 수정해도 초기화되므로 진행 중 수정에 주의합니다. 브라우저 요청 취소가 과금 취소를 보장하지는 않습니다.
- 키와 분석 결과는 화면 메모리에만 유지합니다. 브라우저 직접 입력이 키 보안을 보장하지는 않습니다.
- 길이는 JavaScript 문자열 기준입니다. 전문은 임의로 자르지 않으며 모델 입력 한도를 넘으면 오류를 안내합니다.
- 작품과 요약 속 지시는 실행할 명령으로 취급하지 않도록 안내하며, 분석 응답은 형식·길이를 검증합니다. `warnings`는 자동 차단이나 안전 보증이 아닙니다.
