# OpenAI 작품 분석·표지 생성

프론트엔드 수업용 기능입니다. 사용자가 직접 입력한 OpenAI API 키로 브라우저에서 요청하며, 실제 API 요금이 발생합니다.

## 작품 분석

작품 상세 화면에서 API 키를 입력하고 **장르·소개글·표지용 요약 만들기**를 누르면, 전문을 한 번 보내 다음 결과를 함께 받습니다. 모델은 `gpt-4.1-mini`입니다.

| 필드 | 용도 | 최대 길이 |
| --- | --- | --- |
| `genre` | 예상 장르 1~3개를 쉼표로 구분 | 100자 |
| `introduction` | 독자용 소개글. 인물·상황·갈등을 소개하고 결말·반전은 제외 | 500자 |
| `summary` | 표지 제작용 요약. 배경·인물 관계·분위기·주요 사물과 장면 정리. 필요하면 결말 소재 포함 | 2,000자 |
| `warnings` | 분석 지시 변경·정보 유출 요구 등 의심 내용에 대한 참고 안내 | 최대 5개, 항목당 300자 |

길이는 JavaScript 문자열 길이 기준입니다. 작품 전문은 자르지 않고 보내며, 모델 입력 한도를 초과하면 오류를 안내합니다.

결과는 화면에서 확인·수정하고 **분석 결과 JSON 확인**으로 볼 수 있습니다.

```json
{
  "genre": "현대소설, 성장소설",
  "introduction": "독자에게 보여 줄 작품 소개글",
  "summary": "표지 구상에 필요한 작품 정보",
  "warnings": []
}
```

## 파일 역할과 연결 방법

- `openaiBookAnalysisApi.js`: Responses API 요청, 목적별 작성 지침, JSON 형식·길이 검증.
- `useBookAnalysis.js`: API 키·분석 결과·로딩·오류 상태 관리, 중복 요청 방지 및 화면 이탈 시 요청 취소.
- `BookAnalysis.jsx`: 입력, 결과 확인·수정, 경고와 JSON 표시.
- `App.jsx`: 선택한 작품을 분석 컴포넌트에 전달. 작품이 바뀌면 상태를 초기화하도록 `key` 설정.

다른 화면에서도 다음처럼 연결할 수 있습니다.

```jsx
<BookAnalysis
  key={JSON.stringify([book.id, book.title, book.content])}
  book={book}
/>
```

화면 없이 요청 함수만 사용하려면 다음 형식으로 호출합니다.

```js
const result = await analyzeBook({
  book: { title, content },
  userApiKey,
  signal: controller.signal, // 선택: AbortController의 signal
});
```

## 현재 범위와 추후 통합

- 분석 결과와 키는 화면 메모리에만 유지합니다. 새로고침하거나 다른 작품으로 이동하면 초기화됩니다.
- 공통 `types.js`, 도서 API, DB 저장은 연결하지 않았습니다. 필드 정의와 저장·노출 방식은 팀장님 검토 후 통합합니다.
- 기존 `BookCoverGenerator.jsx` → `useBookCoverGenerator.js` → `openaiImageApi.js`의 **전문 기반 표지 생성**은 유지합니다.
- **장르·표지용 요약 기반 표지 생성**은 분석 화면 하단에서 별도로 제공합니다. 수정한 `genre`와 `summary`, 제목·작성자만 보내며 전문과 독자용 `introduction`은 보내지 않습니다. 위에서 입력한 API 키를 사용합니다.
- `SummaryBookCoverGenerator.jsx` → `useSummaryBookCoverGenerator.js` → `openaiSummaryImageApi.js`가 새 생성 흐름입니다. 품질 선택·미리보기·요청 취소를 제공하며, 장르나 요약이 바뀌면 기존 미리보기를 초기화합니다.
- `BookAnalysis`에 선택 인자 `onSaveCover(dataUrl)`를 전달하면 저장 버튼을 제공합니다. 현재 `App.jsx`에서는 기존 표지 저장 API에 연결되어 있으며, 본인 확인 후 저장하면 작품 표지가 교체됩니다. 분석 결과 자체는 여전히 저장하지 않습니다.

## 프롬프트 방어

작품은 지시문과 분리된 자료로 전달하고, 역할 변경·지침 무시·정보 유출 요구를 따르지 않도록 안내합니다. 응답 필드와 길이를 검증하며 결과는 일반 텍스트로 표시합니다.

경고는 작품 자동 차단이나 안전 보증이 아닌 AI의 참고 판단입니다. 다음 이미지 생성 요청에서도 분석 결과를 실행할 지시가 아닌 작품 자료로 취급해야 합니다. API 키는 요청 인증 헤더에만 사용하지만, 브라우저 직접 입력 방식이 키 보안을 보장하지는 않습니다.
