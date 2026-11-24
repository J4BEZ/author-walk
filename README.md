# 작가의 산책 (author-walk)

누구나 글을 쓰고, AI 가 글에 어울리는 표지를 만들어 주는 도서 관리 시스템입니다.   
React 19 + Vite 화면과, json-server 를 모듈로 띄운 커스텀 서버 (`server/`) 로 이루어져 있습니다.   
로그인은 JWT, 표지는 OpenAI GPT Image API 로 만들고 서버가 파일 (원본 + 썸네일) 로 저장합니다.

---

## 1. 처음 실행하기

```bash
cd /path/to/author-walk   # author-walk 폴더로 이동
npm install               # 처음 한 번 (package-lock.json 기준으로 같은 버전이 깔림)
cp .env.example .env      # 환경 변수 파일 만들기 (Windows 는 복사 후 이름 변경)

npm run server            # 터미널 1 : API 서버 (http://localhost:3000/books)

# 다른 터미널을 연 다음에 진행해 주세요!
cd /path/to/author-walk
npm run dev               # 터미널 2 : 화면 (http://localhost:5173)
```

| 스크립트 | 하는 일 |
| --- | --- |
| `npm run dev` | 화면 개발 서버 (5173) |
| `npm run server` | API 서버 (3000, `db.json`) |
| `npm run server:watch` | 서버 코드를 고치면 자동으로 다시 켜지는 API 서버 |
| `npm run server-with-delay` | 응답을 1초 늦춘 API 서버 (로딩 화면, 버튼 비활성화 확인용) |
| `npm run set-role -- <아이디> <admin\|user>` | 계정 역할 바꾸기 (서버를 돌리는 사람만, 비밀번호는 그대로) |
| `npm run extract-covers` | `db.json` 안의 data URL 표지를 파일로 옮기기 (한 번만, 백업 자동) |
| `npm run lint` | 코드 검사 |
| `npm run build` | 배포용 빌드 |

- 테스트 계정 (`gildong1234`, `younghee5678`, `admin`) 의 비밀번호는 팀에 따로 전달합니다
- 새 계정은 화면의 회원가입 (`/signup`) 으로 만들고, 관리자가 필요하면 `npm run set-role` 로 승격합니다

---

## 2. 폴더 구조

```
src/
  api/client.js          공통 요청 (주소, 30초 제한, 에러 해석), toApiUrl (표지 주소)
  components/            여러 페이지가 함께 쓰는 Header, Footer, SearchBar
  features/
    auth/                회원가입, 로그인, 로그인 상태 (useAuth)
    books/               도서 목록, 상세, 등록, 수정, 삭제, 좋아요, 검색
    OpenAI_Integration/  AI 표지 생성, 작품 분석
  pages/                 주소 하나에 화면 하나 (feature 를 조립)
  utils/                 화면과 서버가 함께 쓰는 순수 함수 (입력 검사, 역할과 권한)
  styles/                페이지, 컴포넌트 CSS
server/
  index.js               API 서버 (json-server + 직접 만든 라우트)
  routes/                /auth, /books
  middlewares/           로그인 확인, 주인 확인, 표지 저장
  utils/                 비밀번호 해시, 토큰, 계정, 표지 파일
  scripts/               set-role, extract-covers
  covers/                저장된 표지 (git 에 올리지 않음)
docs/
  API.md                 페이지별 API, 엔드포인트, 관계도
  STRUCTURE.md           폴더 구조 설계와 import 규칙
db.json                  데이터 (books, users)
```

- 폴더를 나눈 기준과 import 규칙은 [docs/STRUCTURE.md](docs/STRUCTURE.md) 에 있습니다
- 페이지마다 어떤 훅과 요청을 쓰는지, 엔드포인트와 관계도는 [docs/API.md](docs/API.md) 에 있습니다

---

## 3. 데이터 모양 (`db.json`)

### books

| 필드 | 설명 |
| --- | --- |
| `id` | json-server 가 자동으로 붙이는 번호 |
| `title`, `author`, `content` | 제목, 작가 이름 (필명), 본문 |
| `description` | 작품 소개. 없으면 빈 문자열 |
| `userId` | 책 주인의 아이디. 서버가 로그인 토큰으로 정함 |
| `coverImageUrl` | 표지 원본 주소 (`/covers/<uuid>/original.png`). 없으면 `null` |
| `coverThumbnailUrl` | 목록용 썸네일 주소 (`/covers/<uuid>/thumbnail.webp`). 서버만 정함 |
| `likes` | 좋아요 수. 서버만 정함 |
| `createdAt`, `updatedAt` | 등록, 수정 시각 |

### users

| 필드 | 설명 |
| --- | --- |
| `id` | 자동 번호 |
| `userId` | 로그인 아이디 (영문, 숫자, 밑줄 2~15자) |
| `passwordHash` | 비밀번호 해시 (argon2id). 평문은 저장하지 않고 응답에도 넣지 않음 |
| `role` | `user` (가입하면 항상) 또는 `admin` (모든 책을 수정, 삭제) |
| `createdAt` | 가입 시각 |

---

## 4. 로그인과 권한

- 로그인하면 서버가 1시간짜리 토큰을 주고, 화면은 브라우저에 보관했다가 요청마다 `Authorization: Bearer <토큰>` 으로 보냅니다
- 책 읽기는 누구나, 등록은 로그인한 사람, 수정과 삭제는 **책 주인 또는 admin** 만 할 수 있습니다
- 권한 판단은 `src/utils/roles.js` 의 `canModifyBook(user, book)` 하나를 서버와 화면이 함께 씁니다 (화면은 버튼을 숨기고, 실제로 막는 것은 서버)

---

## 5. 화면에서 쓰는 법 : 훅

### 로그인 상태 : `useAuth()`

```js
const { token, user, checking, login, logout } = useAuth();
// user : { userId, role } 또는 null, checking : 새로고침 직후 토큰을 확인하는 중
```

### 목록 : `useBookList(token)`

```js
const { books, loading, error, reload, addBook, editBook, changeCover, removeBook } = useBookList(token);
```

| 값 | 설명 |
| --- | --- |
| `books`, `loading`, `error` | 목록, 불러오는 중인지, 실패 문구 (처음 한 번 자동으로 불러옴) |
| `reload()` | 목록 다시 불러오기 (검색, 정렬은 받은 목록에서 `queryBooks` 로) |
| `addBook(input)` | 등록 -> 목록 맨 앞에 추가 |
| `editBook(id, changes)` | 수정 (바뀐 필드만) -> 목록에서 바꿔 끼움 |
| `changeCover(id, dataUrl)` | 표지 저장 (생성, 재생성) |
| `removeBook(id)` | 삭제 -> 목록에서 뺌 |

- `App.jsx` 에서 **한 번만** 부르고 필요한 페이지에 props 로 내려 줍니다 (페이지마다 부르면 목록이 따로 생겨 서로 반영되지 않음)
- 등록, 수정, 삭제는 실패하면 에러를 던지므로 `try / catch` 로 감쌉니다. 로그인이 필요하거나 권한이 없으면 `e.cause === 'NOT_OWNER'` 이고 `e.message` 를 그대로 보여 줘도 됩니다

### 상세, 수정 : `useBookDetail(id)`

```js
const { book, loading, error, setBook } = useBookDetail(id);   // id 가 바뀌면 다시 불러옴
```

### 좋아요 : `useBookLikes()`

```js
const { likeBook, getBookLikes, likingIds } = useBookLikes();
```

### 표지 주소 : `toApiUrl(path)`

`/covers/...` 는 API 서버에 있으므로 `<img src={toApiUrl(book.coverImageUrl)} />` 처럼 API 서버 주소를 붙여 씁니다. (data URL 은 그대로)

---

## 6. 환경 변수 (`.env`)

```
VITE_API_URL=http://localhost:3000
JWT_SECRET=<32바이트 이상 무작위 문자열>
```

- `.env.example` 을 복사해서 `.env` 로 씁니다. **`.env` 는 git 에 올리지 않습니다**
- `JWT_SECRET` 은 서버만 읽습니다. 만드는 명령은 `.env.example` 에 있고, `VITE_` 를 붙이지 않습니다 (붙이면 브라우저 번들에 들어감)
- `JWT_SECRET` 을 비워 두면 서버가 켜질 때마다 임시 키를 만들어 씁니다 (서버를 다시 켜면 다시 로그인)
- 바꾼 뒤에는 `npm run dev`, `npm run server` 를 다시 켭니다

### 조원이 같은 서버를 보려면 (선택)

한 사람이 API 서버를 켜고 Cloudflare 터널을 열면, 모두 `.env` 의 `VITE_API_URL` 을 터널 주소로 바꿔 같은 데이터를 봅니다.

```bash
npm run server
cloudflared tunnel --url http://localhost:3000
```

- 주소를 아는 누구나 요청을 보낼 수 있으니 조 안에서만 공유합니다. 터널을 다시 켜면 주소가 바뀝니다
- 표지 파일 (`server/covers/`) 은 서버를 켠 PC 에만 있습니다

---

## 7. 알아 둘 한계

- 여러 사람이 같은 도서를 동시에 고치면 늦게 저장한 쪽이 이깁니다 (json-server 는 동시 수정을 막지 않음)
- 좋아요는 누를 때마다 1씩 올라갑니다 (사용자별 한 번 제한, 취소는 아직 없음)
- 메뉴의 마이페이지, 내 작품, 구독 작품은 준비 중입니다
