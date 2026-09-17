# FILM STOCK

Notion FILM STOCK Main Data Source를 읽기 전용 CMS로 사용하는 공개 영화 아카이브입니다. Next.js 16 App Router, TypeScript, Tailwind CSS, 공식 `@notionhq/client`를 사용합니다. 영화 정보는 Notion이 source of truth이며 별도 DB는 없습니다.

## 설치 및 실행

Node.js 22.x와 npm이 필요합니다. Vercel에서도 Node 22 major를 사용합니다. 현재 repository 루트에서 실행합니다.

```sh
npm install
```

루트에 `.env.local`을 만들고 아래 두 변수를 설정합니다. `.env.example`에는 변수 이름과 빈 값만 있습니다. 기존 `.env.local`이 있다면 덮어쓰지 마세요.

```dotenv
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SITE_URL=
```

- `NOTION_TOKEN`: Notion integration의 토큰. Read content 권한을 부여하고 FILM STOCK 데이터베이스의 Connections에 해당 integration을 연결합니다.
- `NOTION_DATA_SOURCE_ID`: FILM STOCK의 **Main Data Source ID**. 데이터베이스 ID나 view ID와 다릅니다. Notion의 데이터 소스 메뉴에서 ID를 복사하거나, 공식 Retrieve a database 응답의 `data_sources`에서 Main 항목의 ID를 확인합니다.

- `NEXT_PUBLIC_GA_ID` (선택): `G-`로 시작하는 유효한 GA4 Measurement ID가 있을 때만 Google Analytics 스크립트를 로드합니다. 초기 방문과 클라이언트 route 변경의 page_view를 보냅니다. 없거나 형식이 틀리면 비활성입니다.
- `NEXT_PUBLIC_SITE_URL` (선택): 공개 사이트 origin. canonical, 공유, sitemap, JSON-LD에 사용합니다. 미설정 시 Vercel production URL을 사용하고, 로컬에서는 localhost:3000으로 대체합니다.

실제 토큰을 채팅, 코드, 로그 또는 GitHub에 올리지 마세요. `.env.local`과 다른 `.env*` 파일은 Git에서 제외하며 빈 `.env.example`만 추적합니다. Notion 변수에는 `NEXT_PUBLIC_` 접두사를 사용하지 않습니다.

```sh
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 환경변수 변경 후에는 개발 서버를 재시작합니다.

## 데이터 흐름

Server Component → `lib/notion/movies.ts`의 캐시된 dataset → cache miss 시 서버 전용 Client → `dataSources.query` → cursor pagination → defensive Movie mapper → 각 페이지의 검색/정렬/집계 → 화면. 전체 배열을 클라이언트에 전달하지 않고 필요한 영화와 필터 옵션만 렌더링합니다.

- `types/movie.ts`: UI에서 사용하는 Movie 타입.
- `lib/notion/client.ts`: 서버 환경변수로 인증, API 버전 `2026-03-11`, 요청 timeout, 캐시 비활성화. `server-only`로 클라이언트 import를 차단합니다.
- `lib/notion/movies.ts`: Data Source ID로 조회하고 전체 결과를 변환합니다. 로그에는 오류 코드만 남깁니다.
- `lib/notion/pagination.ts`: `page_size: 100`으로 호출된 응답의 `has_more`, `next_cursor`를 처리합니다. 다음 페이지 실패나 잘못된 cursor는 전체 조회 실패로 처리합니다.
- `lib/notion/mapper.ts`: 누락/타입 불일치 시 문자열 `""`, 목록 `[]`, 날짜/숫자 `null`을 반환합니다. Notion의 text 속성은 API에서 `rich_text`로 읽습니다. formula는 사용하지 않으며 `상영시간` number만 읽습니다.
- `lib/movies/`: 검색, 필터, 7종 정렬, 12편 pagination, slug, 별 계산, 랜덤 후보, 관련 영화, cover 처리.
- `lib/stats/aggregate.ts`: 영화 수, 평균/분포, 장르/국가/감독/배우/OTT/개봉연도 집계. null 평점 제외, 0점 포함. 인물은 쉼표/줄바꿈/중점/슬래시/세미콜론 등으로만 분리하며 공백/하이픈/마침표는 보존합니다. 동일 영화의 동일 항목은 중복 집계하지 않습니다.
- `components/layout/`: sticky header, 모바일 메뉴, OS 기반 테마 및 사용자 선택 기억, footer.
- `components/movie/`: 포스터, 별점, 카드, 공유, 독립적인 ReviewSection. 카드에는 관람일을 표시하지 않습니다.
- `components/filters/`: desktop sticky sidebar, native dialog 모바일 필터, URL 기반 정렬과 compact pagination.
- `components/shared/`: 검색, 빈 상태, loading, 선택적 GA4.
- `app/page.tsx`: 한줄평이 있는 영화에서 중복 없는 랜덤 4편.
- `app/films/page.tsx`: 전체 영화 탐색. q, genre, country, ott, rating(최소 평점), watchedYear, releaseYear, tag, sort, page를 URL에 저장합니다. 각 facet은 단일 선택이며 서로 AND로 결합합니다. 필터 옵션은 실제 영화에서 추출합니다.
- `app/film/[slug]/page.tsx`: 포스터, 핵심 메타데이터, 한줄평, 리뷰 빈 상태, 관련 영화 4편, 공유 및 동적 SEO.
- `app/stats/page.tsx`, `app/about/page.tsx`: 영화 통계와 사이트 소개.
- `app/layout.tsx`, `app/globals.css`: 공통 메타데이터, Noto Sans KR, light/dark 및 반응형 스타일.
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`: 안전한 에러/404/로딩 처리.
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `lib/seo/site.ts`: sitemap, robots, 기본 OG 이미지, canonical, 안전한 JSON-LD 직렬화. 필터 검색 URL은 noindex/follow입니다. 긴 리뷰나 aggregateRating을 만들어내지 않습니다.
- `tests/notion.test.ts`: 변환, 정렬, 여러 페이지, 빈 결과, 실패 응답 검사.
- `tests/movies.test.ts`: slug, 검색, 필터, 정렬, pagination, 반별, 홈 후보, 관련 영화, 통계, cover 만료, JSON-LD escape 검사.

상세 URL은 `/film/{title}-{shortId}`이며 shortId는 전체 Notion UUID를 base36으로 압축합니다(최대 25자). 단순 6자 절단에 따른 충돌을 피하고 제목 변경과 동명 영화에도 안정적입니다. 제목이 바뀐 옛 URL은 현재 canonical URL로 redirect됩니다.

별은 가장 가까운 0.5 단위로 채우고 작은 숫자는 원래 평점을 보존합니다. 관련 영화는 같은 감독 5점, 장르 3점, 태그 2점, 국가 1점으로 합산하고 동률은 평점/ID로 정렬합니다. 개인화는 없습니다.

## 캐싱 및 포스터

Next.js 16 `cacheComponents`와 함수 단위 `use cache`를 사용합니다. dataset은 stale 60초, revalidate 300초, expire 900초이며 `filmstock-movies` tag를 부여합니다. React `cache`로 한 렌더 내 metadata/page의 중복 조회도 줄입니다. 실패한 부분 목록이나 빈 가짜 데이터를 정상 결과로 캐시하지 않습니다.

`connection()` 이후 랜덤 선택을 실행하므로 dataset 캐시와 랜덤 결과는 분리됩니다. Home 링크는 새 문서 탐색으로 요청하므로 새 방문/refresh마다 다른 조합이 가능하며, 랜덤 때문에 Notion 전체 API를 매번 호출하지 않습니다. 배포의 여러 인스턴스에서는 각 인스턴스의 cold cache가 별도로 채워질 수 있습니다.

이전 검증 버전과 달리 **Notion 수정은 매 새로고침 즉시 반영되지 않을 수 있습니다.** 5분 후 요청이 background 재검증을 유발하고, 완료 후 새로고침하면 반영됩니다. 15분이 지난 cache는 새 조회를 기다립니다. 재배포나 코드 수정은 필요 없습니다. cold load는 여전히 전체 cursor 조회 시간이 필요합니다.

Notion file/external cover를 사용하며 signed URL과 expiry를 Movie에 매핑합니다. 30초 이내 만료되거나 이미 만료된 cover는 placeholder로 표시합니다. Next/Image 최적화는 제한된 Notion S3/Notion static/Unsplash 호스트에만 허용합니다. 다른 external URL은 서버 proxy 없이 브라우저가 원본을 로드합니다. 최적화 실패 시 원본을 한 번 시도하고, 원본도 실패하면 같은 2:3 비율의 placeholder로 대체합니다. 이미지 URL을 영구 저장하지 않으며, 오래 열어둔 화면은 새로고침하여 갱신합니다.

Noto Sans KR는 next/font로 빌드 시 받아 자체 제공하므로 최초 빌드에는 폰트 다운로드 네트워크 접근이 필요합니다. 아이콘은 lucide-react를 사용합니다.

## 검증

```sh
npm run lint
npm test
npm run build
```

환경변수가 없어도 빌드는 가능합니다. 실제 연결 검증에는 두 환경변수와 integration의 읽기 권한이 필요합니다.

현재 Next.js의 React ESLint 플러그인은 ESLint 10에서 실행 오류가 발생하여 ESLint 9.39.5로 고정했습니다. npm에서 ESLint 9 지원 종료 경고가 나올 수 있으며, 플러그인의 ESLint 10 호환 업데이트 후 함께 올려야 합니다.

1. Home의 Featured 1편 + 카드 3편이 중복 없이 바뀌는지 확인합니다.
2. Films의 총 편수, 12편 pagination, 필터 조합/제거/초기화, 정렬, 검색 0건, URL 공유/refresh/back/forward를 확인합니다.
3. 상세 URL, 큰 포스터, 별점, 한줄평, metadata, 리뷰 빈 영역, 관련 영화, 공유/복사를 확인합니다.
4. Notion에 새 영화를 직접 추가한 뒤 재검증 간격 이후 반영되는지 확인합니다. 자동 테스트에서는 Notion을 수정하지 않습니다.
5. desktop/mobile, OS/선택 테마, 키보드 focus, dialog 닫기/Escape, reduced motion, cover 실패 및 누락 metadata를 확인합니다.
6. `/stats`, `/about`, 잘못된 상세 URL, `/sitemap.xml`, `/robots.txt`, OG 이미지, canonical과 JSON-LD를 확인합니다.

PowerShell에서 실행 정책 문제가 있으면 `npm.cmd install`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run dev`를 사용합니다.

인증 실패는 토큰 설정을, `object_not_found`는 Main Data Source ID 및 Connections 공유를 확인합니다. 화면에는 API 응답이나 secret을 표시하지 않습니다. Notion API가 대규모 조회 결과를 `incomplete`로 보고하면 부분 목록을 정상 결과로 표시하지 않고 실패 처리합니다. 이 규모에서는 조회 구간 분할이 추가로 필요합니다.

## Vercel

프로젝트를 Next.js로 가져오고 Root Directory는 repository 루트를 사용합니다. Project Settings → Environment Variables에서 `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`를 설정합니다. 필요한 Production/Preview/Development 환경에 적용하고 변경 후 재배포합니다. `.env.local` 파일 자체는 업로드하거나 commit하지 않습니다.

공개 canonical 도메인은 `NEXT_PUBLIC_SITE_URL`로 설정하는 것을 권장합니다. GA4는 `NEXT_PUBLIC_GA_ID`가 있을 때만 활성화됩니다. 데이터 수집 정책에 맞게 활성화하세요. 로컬 검증 작업은 배포나 자동 push를 수행하지 않습니다.

웹사이트에 표시된 영화 기록은 사이트 방문자가 읽을 수 있습니다. 이번 단계에는 인증이 없으므로 공개할 기록만 연결하세요.

## Phase 2

긴 리뷰는 현재 저장하지 않습니다. 상세의 `ReviewSection`은 빈 상태만 표시하며, Movie와 미래 Review domain을 섞지 않습니다. Supabase, 관리자 Google 로그인, editor, draft/private/published, autosave, preview, 좋아요 저장, 댓글, 뉴스레터, 이미지 업로드, Kakao SDK 및 개인화/AI 추천은 구현하지 않았습니다.

## 공식 문서

- [Notion JavaScript SDK](https://github.com/makenotion/notion-sdk-js)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
