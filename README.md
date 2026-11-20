# 작가의 산책 (author-walk)

누구나 글을 쓰고, AI 가 글에 어울리는 표지를 만들어 주는 도서 관리 시스템입니다.   
React 19 + Vite, 데이터는 json-server (`db.json`), 표지는 OpenAI GPT Image API 를 씁니다.

---

## 1. 처음 실행하기

```bash
cd /path/to/author-walk # author-walk 폴더로 이동
npm install          # 처음 한 번 (package-lock.json 기준으로 같은 버전이 깔림)
cp .env.example .env # 환경 변수 파일 만들기 (Windows 는 복사 후 이름 변경)

npm run server       # 터미널 1 : json-server (http://localhost:3000/books)

# 다른 터미널 연 다음에 진행해주세요!
cd /path/to/author-walk # author-walk 폴더로 이동
npm run dev          # 터미널 2 : 화면 (http://localhost:5173)
```

| 스크립트 | 하는 일 |
| --- | --- |
| `npm run dev` | 화면 개발 서버 |
| `npm run server` | json-server (`db.json`, 3000번) |
| `npm run server-with-delay` | 응답을 1초 늦춘 json-server. 로딩 화면, 버튼 비활성화 확인용 |
| `npm run lint` | 코드 검사 |
| `npm run build` | 배포용 빌드 |

- `db.json` 의 예시 도서 비밀번호는 `1234` (홍길동), `5678` (김영희) 입니다

---

## 2. 폴더 구조

```
src/
  features/books/
    types.js       데이터 모양 (JSDoc 타입)
    booksApi.js    json-server 와 대화하는 함수 (fetch 는 여기에만)
    useBooks.js    State 와 booksApi 를 잇는 훅 (useBooks, useBook)
  examples/
    BooksApiPlayground.jsx   booksApi 함수를 버튼으로 하나씩 시험하는 페이지
  App.jsx          화면별 훅 사용 예시 (임시)
docs/
  API.md           페이지별 API, 엔드포인트 명세, 관계도
db.json            json-server 데이터
```

- 페이지마다 어떤 훅과 요청을 쓰는지, 전체 흐름 관계도는 [docs/API.md](docs/API.md) 에 있습니다.

- 5차 미프에서 json-server 를 Spring Boot 로 바꿔도 `booksApi.js` 와 `.env` 만 고치면 됩니다.

---

## 3. 데이터 모양 (`db.json`)

| 필드 | 설명 |
| --- | --- |
| `id` | json-server 가 자동으로 붙이는 번호 |
| `title`, `author`, `content` | 제목, 작성자, 본문 |
| `description` | 작품 소개. 없으면 빈 문자열 |
| `userId` | 작성한 사용자 아이디. 수정, 삭제 때 본인 확인에 사용 (임시, `null` 이면 수정, 삭제 불가) |
| `passwordHash` | 비밀번호의 SHA-256 해시. <br/>평문은 저장하지 않고, 훅과 booksApi 가 돌려주는 값에서는 빠짐 |
| `coverImageUrl` | 표지 Data URL (`data:image/png;base64,...`). 없으면 `null` |
| `createdAt`, `updatedAt` | 등록, 수정 시각 (booksApi 가 자동으로 채움) |

---

## 4. 화면에서 쓰는 법 : 훅

### 목록 화면 : `useBooks()`

```js
const { books, loading, error, reload, addBook, editBook, changeCover, removeBook } = useBooks();
```

| 값 | 설명 |
| --- | --- |
| `books`, `loading`, `error` | 목록, 불러오는 중인지, 실패 문구 (처음 한 번 자동으로 불러옴) |
| `reload(query?)` | 다시 불러오기. 검색어를 주면 검색 |
| `addBook(input)` | 등록 -> 목록 맨 앞에 추가 |
| `editBook(id, changes, { userId, password })` | 본인 확인 -> 수정 -> 목록에서 바꿔 끼움 |
| `changeCover(id, dataUrl)` | 표지 저장 (생성, 재생성) |
| `removeBook(id, { userId, password })` | 본인 확인 -> 삭제 -> 목록에서 뺌 |

- `useBooks()` 는 **App 같은 공통 부모에서 한 번만** 부르고 필요한 화면에 props 로 내려 줍니다. 
- (화면마다 따로 부르면 목록이 따로 생겨서 서로 반영되지 않습니다
- 등록, 수정, 삭제는 실패하면 에러를 던지므로 `try / catch` 로 감쌉니다. 본인 확인 실패는 `e.cause === 'NOT_OWNER'` 입니다

```js
const handleDelete = async () => {
  if (!confirm('삭제할까요?')) return;
  try {
    await removeBook(book.id, { userId, password });
  } catch (e) {
    alert(e.cause === 'NOT_OWNER' ? e.message : '삭제에 실패했어요');
  }
};
```

### 상세, 수정 화면 : `useBook(id)`

```js
const { book, loading, error, setBook } = useBook(id);   // id 가 바뀌면 다시 불러옴
```

수정이나 표지 저장 뒤에는 돌려받은 값으로 `setBook(updated)` 해서 상세 화면도 바로 바꿉니다.

화면별 전체 예시는 `src/App.jsx` 에 있습니다.

---

## 5. 서버와 직접 대화 : `booksApi.js`

훅을 쓰지 않고 함수만 필요할 때 씁니다.

| 함수 | HTTP 요청 | 돌려주는 값 |
| --- | --- | --- |
| `getBooks(query?)` | `GET /books?_sort=createdAt&_order=desc&q=검색어` | 도서 배열 (최신순) |
| `getBook(id)` | `GET /books/:id` | 도서 한 권 |
| `createBook(input)` | `POST /books` | 저장된 도서 |
| `checkOwner(id, userId, password)` | `GET /books/:id` 후 비교 | `true` / `false` |
| `updateBook(id, changes)` | `PATCH /books/:id` | 수정된 도서 |
| `saveCover(id, dataUrl)` | `PATCH /books/:id` | 수정된 도서 |
| `deleteBook(id)` | `DELETE /books/:id` | 없음 |

- 응답이 5초 안에 없으면 `TimeoutError`, 404 같은 실패는 `e.cause` 에 상태 코드가 들어 있습니다
- 함수를 버튼으로 하나씩 시험하려면 `App.jsx` 에서 `src/examples/BooksApiPlayground.jsx` 를 임시로 보여 줍니다

---

## 6. 환경 변수 (`.env`)

```
VITE_API_URL=http://localhost:3000
```

- `.env.example` 을 복사해서 `.env` 로 씁니다.   
**`.env` 는 git 에 올리지 않습니다**
- 바꾼 뒤에는 `npm run dev` 를 다시 켭니다


### 조원이 같은 db.json 을 보려면 (선택)

한 사람이 json-server 를 켜고 Cloudflare 터널을 열면, 모두 `.env` 의 `VITE_API_URL` 을 터널 주소로 바꿔 같은 데이터를 봅니다.

```bash
npx json-server --watch db.json --port 3000 --host 127.0.0.1
cloudflared tunnel --url http://127.0.0.1:3000
```

- `--host 127.0.0.1` 을 붙여야 터널이 연결됩니다 (기본값은 IPv6 로만 열리는 경우가 있음)
- 주소를 아는 누구나 읽고 쓸 수 있으니 조 안에서만 공유합니다. 터널을 다시 켜면 주소가 바뀝니다

---

## 7. 알아 둘 한계

- 여러 사람이 같은 도서를 동시에 고치면 늦게 저장한 쪽이 이깁니다 (json-server 는 동시 수정을 막지 않음)

---

