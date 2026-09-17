# FILM STOCK

Notion FILM STOCK Main Data Source를 읽기 전용 CMS로 사용하는 개인 영화 아카이브입니다. Next.js App Router, TypeScript, Tailwind CSS, 공식 `@notionhq/client`를 사용합니다.

## 설치 및 실행

Node.js 22 LTS 이상과 npm이 필요합니다. 현재 repository 루트에서 실행합니다.

```sh
npm install
```

루트에 `.env.local`을 만들고 아래 두 변수를 설정합니다. `.env.example`에는 변수 이름과 빈 값만 있습니다. 기존 `.env.local`이 있다면 덮어쓰지 마세요.

```dotenv
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
```

- `NOTION_TOKEN`: Notion integration의 토큰. Read content 권한을 부여하고 FILM STOCK 데이터베이스의 Connections에 해당 integration을 연결합니다.
- `NOTION_DATA_SOURCE_ID`: FILM STOCK의 **Main Data Source ID**. 데이터베이스 ID나 view ID와 다릅니다. Notion의 데이터 소스 메뉴에서 ID를 복사하거나, 공식 Retrieve a database 응답의 `data_sources`에서 Main 항목의 ID를 확인합니다.

실제 토큰을 채팅, 코드, 로그 또는 GitHub에 올리지 마세요. `.env.local`과 다른 `.env*` 파일은 Git에서 제외하며 빈 `.env.example`만 추적합니다. `NEXT_PUBLIC_` 접두사는 사용하지 않습니다.

```sh
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 환경변수 변경 후에는 개발 서버를 재시작합니다.

## 데이터 흐름

`app/page.tsx` (Server Component) → `lib/notion/movies.ts` → `client.ts`의 서버 전용 Notion Client → `dataSources.query` → `pagination.ts`의 cursor 반복 조회 → `mapper.ts`의 Movie 변환 및 관람일 정렬 → `MovieCard.tsx`.

- `types/movie.ts`: UI에서 사용하는 Movie 타입.
- `lib/notion/client.ts`: 서버 환경변수로 인증, API 버전 `2026-03-11`, 요청 timeout, 캐시 비활성화. `server-only`로 클라이언트 import를 차단합니다.
- `lib/notion/movies.ts`: Data Source ID로 조회하고 전체 결과를 변환합니다. 로그에는 오류 코드만 남깁니다.
- `lib/notion/pagination.ts`: `page_size: 100`으로 호출된 응답의 `has_more`, `next_cursor`를 처리합니다. 다음 페이지 실패나 잘못된 cursor는 전체 조회 실패로 처리합니다.
- `lib/notion/mapper.ts`: 누락/타입 불일치 시 문자열 `""`, 목록 `[]`, 날짜/숫자 `null`을 반환합니다. Notion의 text 속성은 API에서 `rich_text`로 읽습니다. formula는 사용하지 않으며 `상영시간` number만 읽습니다.
- `components/MovieCard.tsx`: 이름, 감독, 숫자 평점, 장르, 한줄평, 관람일 표시.
- `app/page.tsx`: 관람일 최신순 목록, 날짜 없는 영화는 마지막, 오류/빈 목록 상태. 동적 렌더링으로 매 요청 다시 조회합니다.
- `app/layout.tsx`, `app/globals.css`: 공통 메타데이터와 최소 스타일.
- `tests/notion.test.ts`: 변환, 정렬, 여러 페이지, 빈 결과, 실패 응답 검사.

Notion에 영화를 추가하거나 수정한 후 브라우저를 새로고침하면 코드를 수정하거나 재배포하지 않아도 반영됩니다. 이미지, formula, 페이지 본문, 검색, 수정 기능은 사용하지 않습니다.

## 검증

```sh
npm run lint
npm test
npm run build
```

환경변수가 없어도 빌드는 가능합니다. 실제 연결 검증에는 두 환경변수와 integration의 읽기 권한이 필요합니다.

현재 Next.js의 React ESLint 플러그인은 ESLint 10에서 실행 오류가 발생하여 ESLint 9.39.5로 고정했습니다. npm에서 ESLint 9 지원 종료 경고가 나올 수 있으며, 플러그인의 ESLint 10 호환 업데이트 후 함께 올려야 합니다.

1. 실제 영화의 이름, 감독, `4.5 / 5` 같은 숫자 평점, ` · `로 연결된 장르, 한줄평, 관람일을 확인합니다.
2. 100개가 넘는 영화도 모두 조회되는지 Notion과 편수를 비교합니다.
3. 관람일 최신순 및 날짜 없는 영화의 마지막 배치를 확인합니다.
4. Notion에 새 영화를 추가하고 새로고침하여 반영 여부를 확인합니다.
5. 선택 속성을 비워도 페이지가 정상 표시되는지 확인합니다.
6. 빈 데이터 소스는 빈 목록 안내, 잘못된 설정/권한은 오류 안내가 나타나는지 확인합니다.

인증 실패는 토큰 설정을, `object_not_found`는 Main Data Source ID 및 Connections 공유를 확인합니다. 화면에는 API 응답이나 secret을 표시하지 않습니다. Notion API가 대규모 조회 결과를 `incomplete`로 보고하면 부분 목록을 정상 결과로 표시하지 않고 실패 처리합니다. 이 규모에서는 조회 구간 분할이 추가로 필요합니다.

## Vercel

프로젝트를 Next.js로 가져오고 Root Directory는 repository 루트를 사용합니다. Project Settings → Environment Variables에서 `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`를 설정합니다. 필요한 Production/Preview/Development 환경에 적용하고 변경 후 재배포합니다. `.env.local` 파일 자체는 업로드하거나 commit하지 않습니다.

웹사이트에 표시된 영화 기록은 사이트 방문자가 읽을 수 있습니다. 이번 단계에는 인증이 없으므로 공개할 기록만 연결하세요.

## 공식 문서

- [Notion JavaScript SDK](https://github.com/makenotion/notion-sdk-js)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation)
