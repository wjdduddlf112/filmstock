# FILM STOCK

Notion FILM STOCK Main Data Source를 읽기 전용 영화 metadata CMS로 사용하는 공개 영화 아카이브입니다. Next.js 16 App Router, TypeScript, Tailwind CSS, 공식 `@notionhq/client`를 사용합니다. 영화 정보는 Notion, 긴 리뷰와 관리자 인증은 Supabase가 담당합니다.

## 설치 및 실행

Node.js 22.x와 npm이 필요합니다. Vercel에서도 Node 22 major를 사용합니다. 현재 repository 루트에서 실행합니다.

```sh
npm install
```

루트 `.env.local`에 영화 조회용 Notion 변수와 CMS용 Supabase 변수를 설정합니다. GA와 사이트 URL은 선택 사항입니다. `.env.example`에는 변수 이름과 빈 값만 있습니다. 기존 `.env.local`이 있다면 덮어쓰지 마세요.

```dotenv
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
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
- `app/page.tsx`: 발행 리뷰 영화를 우선하고 한줄평 후보로 부족분을 채우는 중복 없는 랜덤 4편.
- `app/films/page.tsx`: 전체 영화 탐색. q, genre, country, ott, rating(최소 평점), watchedYear, releaseYear, tag, review(yes/no), sort, page를 URL에 저장합니다. 각 facet은 단일 선택이며 서로 AND로 결합합니다. 영화 속성 옵션은 실제 영화에서 추출합니다.
- `app/film/[slug]/page.tsx`: 포스터, 핵심 메타데이터, 한줄평, 발행 리뷰 또는 빈 상태, 관련 영화 4편, 공유 및 동적 SEO.
- `app/stats/page.tsx`, `app/about/page.tsx`: 영화 통계와 사이트 소개.
- `app/layout.tsx`, `app/globals.css`: 공통 메타데이터, Noto Sans KR, light/dark 및 반응형 스타일.
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`: 안전한 에러/404/로딩 처리.
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `lib/seo/site.ts`: sitemap, robots, 기본 OG 이미지, canonical, 안전한 JSON-LD 직렬화. 필터 검색 URL은 noindex/follow입니다. 긴 리뷰나 aggregateRating을 만들어내지 않습니다.
- `tests/notion.test.ts`: 변환, 정렬, 여러 페이지, 빈 결과, 실패 응답 검사.
- `tests/movies.test.ts`: slug, 검색, 필터, 정렬, pagination, 반별, 홈 후보, 관련 영화, 통계, cover 만료, JSON-LD escape 검사.

상세 URL은 `/film/{title}-{shortId}`이며 shortId는 전체 Notion UUID를 base36으로 압축합니다(최대 25자). 단순 6자 절단에 따른 충돌을 피하고 제목 변경과 동명 영화에도 안정적입니다. 제목이 바뀐 옛 URL은 현재 canonical URL로 redirect됩니다.

별은 가장 가까운 0.5 단위로 채우고 작은 숫자는 원래 평점을 보존합니다. 관련 영화는 같은 감독 5점, 장르 3점, 태그 2점, 국가 1점으로 합산하고 동률은 평점/ID로 정렬합니다. 개인화는 없습니다.

## 캐싱 및 포스터

Next.js 16 `cacheComponents`와 함수 단위 `use cache`를 사용합니다. dataset은 stale 60초, revalidate 1200초(20분), expire 1800초(30분)이며 `filmstock-movies` tag를 부여합니다. React `cache`로 한 렌더 내 metadata/page의 중복 조회도 줄입니다. 실패한 부분 목록이나 빈 가짜 데이터를 정상 결과로 캐시하지 않습니다.

`connection()` 이후 랜덤 선택을 실행하므로 dataset 캐시와 랜덤 결과는 분리됩니다. Home 링크는 새 문서 탐색으로 요청하므로 새 방문/refresh마다 다른 조합이 가능하며, 랜덤 때문에 Notion 전체 API를 매번 호출하지 않습니다. 배포의 여러 인스턴스에서는 각 인스턴스의 cold cache가 별도로 채워질 수 있습니다.

**Notion 수정은 매 새로고침 즉시 반영되지 않을 수 있습니다.** 20분 후 요청이 background 재검증을 유발하고, 완료 후 새로고침하면 반영됩니다. 30분이 지난 cache는 새 조회를 기다립니다. 재배포나 코드 수정은 필요 없습니다. cold load는 여전히 전체 cursor 조회 시간이 필요합니다. Home/Films는 영화와 공개 리뷰 ID를 병렬 조회하며, Detail의 metadata/page는 같은 영화 dataset과 리뷰 조회를 요청 내 공유합니다. 리뷰 저장은 해당 Detail, Home, Films만 재검증하고 Notion tag는 무효화하지 않습니다.

별점은 `ratingToStars`의 FILM STOCK 구간 매핑을 공통 Rating에서 사용합니다. 숫자 평점은 그대로 표시하며, 미입력/유효하지 않은 값과 정의되지 않은 1점 미만·5점 초과에는 별점을 만들지 않습니다.

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

Notion 영화 metadata는 사이트 방문자가 읽을 수 있습니다. 리뷰는 Supabase에서 `published` 상태인 경우에만 공개합니다.

## 관리자 로그인과 리뷰 CMS

Notion은 영화 metadata, Supabase는 관리자 인증 및 Markdown 긴 리뷰를 담당합니다. 기존 production의 `reviews`, `admin_users`와 RLS를 그대로 사용합니다. 이 프로젝트는 migration, 정책 변경, 첫 관리자 자동 등록을 실행하지 않습니다.

로컬 `.env.local` 및 Vercel에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정합니다. `sb_publishable_` 키만 사용하며 secret/service_role/DB 비밀번호/Google Client Secret은 필요하지 않습니다. 이 값의 추가나 변경 후 개발 서버를 재시작하고 Vercel은 재빌드합니다.

상단 로그인 아이콘에서 Google 로그인 → Supabase PKCE → `/auth/callback`의 code/session 교환 → 보던 공개 페이지(기본 `/`)로 돌아옵니다. 관리자는 계정 메뉴에서 관리자 화면을 별도로 열 수 있습니다. `/admin/login`도 유지하며, 보호된 편집 화면에서 시작한 로그인은 해당 화면으로 돌아옵니다. callback next는 허용된 로컬 공개/admin 경로만 받습니다. 운영 도메인과 사용하는 로컬 주소의 `/auth/callback`을 Supabase Redirect URLs에 등록해야 합니다. `localhost`와 `127.0.0.1`은 서로 다른 origin입니다.

첫 로그인 후 관리자가 아니라고 나오는 것은 정상입니다. Supabase Auth Users에서 해당 사용자 UUID를 확인하고, 외부에서 기존 `admin_users.user_id`에 직접 등록하세요. 앱은 계정을 관리자에 자동 추가하지 않습니다. `admin_users`는 로그인 사용자가 자신의 membership 행을 SELECT할 수 있어야 합니다. 조회 권한이 없으면 앱은 접근을 거부하며 정책을 자동 수정하지 않습니다.

관리자는 `/admin`에서 상태별 리뷰 수와 로그아웃을 사용할 수 있습니다. `/films`에서 영화를 선택한 뒤 상세의 리뷰 작성/수정 버튼으로 `/admin/film/[slug]/edit`에 진입합니다. 모든 보호 페이지와 저장 Server Action은 `getUser()`로 확인한 ID의 membership을 다시 검사합니다. Proxy는 세션 갱신과 private/no-store 헤더를 담당하며, 최종 쓰기 권한은 기존 RLS가 강제합니다.

리뷰 연결 키는 전체 Notion page UUID인 `reviews.notion_page_id`입니다. 새 편집기의 Summary / View Point / Review 템플릿은 열기만 해서는 저장되지 않습니다. 첫 저장은 INSERT, 이후는 UPDATE이며 제목이나 URL short ID는 DB 키가 아닙니다.

편집기는 Markdown textarea, 제목/굵게/기울임/링크/인용/구분선 도구, 공통 미리보기, 스포일러 설정, draft/private/published 선택을 제공합니다. 발행 전환 시 확인하며 `published_at`은 기존 DB 트리거에 맡깁니다. 본문 최대 길이는 200,000자입니다. 임의 HTML은 실행하지 않으며 Markdown 이미지는 이 단계에서 본문 이미지로 로드하지 않습니다.

입력이 4초 멈추고 변경이 있을 때 자동 저장합니다. 요청은 순서대로 보내며 매 저장 응답의 `updated_at`을 다음 조건부 UPDATE에 사용합니다. 서버는 수정 시각을 갱신하고, 다른 탭에서 변경했거나 최초 INSERT가 충돌하면 덮어쓰지 않습니다. 충돌·인증 만료 때는 글을 보관한 뒤 새로고침/재로그인하세요. 실패한 글은 현재 textarea에 남지만 브라우저 종료 후 복구를 보장하는 오프라인 저장소는 아닙니다. 닫기/링크 이동 경고는 보조 장치이며 자동 저장 완료 표시를 확인하세요.

공개 조회는 관리자 쿠키를 사용하지 않는 익명 클라이언트 + `status=published` 조건으로 수행합니다. 본문과 published ID 목록은 요청 범위 React cache로만 중복 조회를 줄이고, 공용 영구 캐시에 넣지 않습니다. 저장 후 공개 경로를 재검증합니다. 이미 열려 있는 다른 브라우저는 새로고침해야 변경이 보입니다. Films는 published ID를 500개 단위로 한 번 모아 Set으로 합치므로 카드마다 쿼리하지 않습니다.

홈은 발행 리뷰 영화 4편 이상이면 해당 후보만, 1~3편이면 해당 후보 우선 + 기존 한줄평 후보로 채우며, 0편이면 기존 방식으로 동작합니다. 카드 REVIEW 배지와 Films 리뷰 여부 필터는 published만 기준으로 합니다. Supabase 미설정/장애 시 공개 영화 아카이브는 유지하고 리뷰는 없는 것으로 처리합니다. 공개 Stats에는 관리자 리뷰 상태를 섞지 않습니다.

주요 파일:

- `lib/supabase/`: 설정, browser, cookie 기반 server, 익명 public client.
- `proxy.ts`, `lib/auth/`, `app/auth/callback/`: 세션 갱신, 회원 확인, 안전한 redirect.
- `types/review.ts`, `lib/reviews/`: 독립 Review domain, public 조회, 입력 검증, 저장 큐.
- `app/admin/`, `components/admin/`: 보호 페이지, 서버 저장, 로그인, 에디터.
- `components/review/Markdown.tsx`: 미리보기와 공개 본문 공통 렌더러.
- `tests/reviews.test.ts`: 권한 helper, redirect, 상태/입력, 후보/필터, 저장 순서/충돌, XSS 및 비공개 본문 차단 테스트.

수동 검증: 미로그인 admin 접근 → 로그인 이동; 미등록 Google 계정 → 권한 없음; membership 등록 후 작성/자동 저장/재접속; 다른 탭 동시 수정 충돌; 발행 후 익명 창에서 본문/배지/필터 확인; 비공개 전환 후 새로고침하여 제거 확인; 로그아웃 후 관리자 접근 차단. 실제 Google OAuth, 권한 있는 저장 및 DB 트리거 동작은 해당 계정으로 검증해야 합니다. 테스트는 production에 리뷰를 만들거나 정책을 변경하지 않습니다.

## 다음 확장

좋아요 저장, 댓글, 뉴스레터, 이미지 업로드, 블록 편집기, 부분 스포일러, Kakao SDK, 개인화/AI 추천은 포함하지 않습니다.

## 공식 문서

- [Notion JavaScript SDK](https://github.com/makenotion/notion-sdk-js)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [Supabase 공식 SSR 클라이언트](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Supabase SSR 및 캐싱 주의사항](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
