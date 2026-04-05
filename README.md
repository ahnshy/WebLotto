# WebLottoNextjs

한국어 | [English](#english)

A **반응형 로또(KR 6/45)** Web Application으로, **Next.js (App Router)**, **Material UI v6**, **Supabase** 로 구현하였습니다.
1. 예상 번호를 생성
2. 역대 당첨 번호 비교
3. 로또 용지 패턴 보드를 분석
4. **여러 추출 모드**를 실행하
5. **시뮬레이션 기반 모의추첨기**
6. 로또 용지 스타일로 출력
7. **DHLottery REST API** 당첨 결과 동기
8. **Light / Dark / Night** 테마
9. **ChatGPT 스타일 사이드바** 제공
10. 동행로또 온라인 사이트 연동 기능 제공

---

## ✨ Features

- **모드**
  - **당첨번호 보기 (Table)**: 최신 회차부터 내림차순으로 표시되며, 6개 당첨번호 + 보너스 번호, **1등 당첨자 수**, **1등 당첨금** 컬럼을 함께 보여줍니다.
  - **패턴 분석 (Boards)**: 로또 용지 형태의 미니 보드 15개씩 표시하며, 6개 번호를 **추첨 순서대로** 연결한 **SVG polyline** 패턴을 제공합니다. **Load more**로 15개씩 추가 로드됩니다.
  - **예상 번호 목록**: 원클릭 번호 생성, 저장된 번호 이력, **전체 선택 / 선택 해제 / 선택 삭제 / 출력**, 추출 방식 배지, 역대 당첨 이력과의 비교를 지원합니다.
  - **통계기반 추출**: 누적 빈출 번호, 미출현 번호, 번호대 비율, 월별 다수출현, 가중치 옵션 등을 조합해 번호를 추출합니다.
  - **패턴기반 추출**: 과거 패턴 분석을 기반으로 금주 예상 패턴을 계산하고 해당 패턴에 맞는 번호를 추출합니다.
  - **AI 딥러닝 추출**: LSTM 기반 예측 모델을 사용하며, 최초 준비 후 메모리 캐시와 저장된 모델을 재사용합니다.
  - **AI 머신러닝 추출**: Random Forest 기반 예측 모델을 사용하며, 최초 준비 후 메모리 캐시와 저장된 모델을 재사용합니다.
  - **시뮬레이션 (모의추첨)**: 원형 추첨통에서 공이 섞이고 레일을 따라 하나씩 배출되는 모의추첨 UI를 제공합니다.
- **비교 및 등수 계산**: 선택한 번호에 대해 역대 당첨 이력 전체 기준으로 **1등 ~ 5등** 적중 횟수를 계산합니다. (2등은 **5개 일치 + 보너스**)
- **공식 데이터 동기화**: **1회차부터 최신 회차까지**  
  `GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}`  
  방식으로 불러오며, 진행률 표시와 함께 `kr_lotto_results`에 upsert 합니다.
- **저장소**
  - 사용자 번호는 `draws` 테이블에 저장됩니다.
  - 앱을 새로고침해도 최근 이력이 유지됩니다.
  - 추출 방식과 태그를 위한 메타데이터 컬럼도 확장 가능합니다.
- **인증 / 권한**
  - Supabase Auth 기반 Google 로그인 지원
  - 로그인 후 헤더에 사용자 프로필 정보 표시
  - 동기화 버튼은 관리자 계정만 활성화 가능
- **UX / UI**
  - **Night / Dark / Light** 테마 토글
  - **접기/펼치기 가능한 사이드바**
  - 무거운 화면 전환 시 **로딩 오버레이**
  - AI 모델 초기화 시 **전용 초기화 오버레이**
  - **컬러 번호 공**, 하이라이트, 흰색 글로우 텍스트

---

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![App Router](https://img.shields.io/badge/App%20Router-enabled-blue?style=flat-square)
![Material UI](https://img.shields.io/badge/MUI-6.x-007FFF?logo=mui&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%2F%20Auth-3FCF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)

- **Next.js 15 (App Router)**, **React 18**
- **Material UI v6** (`@mui/material`, `@mui/icons-material`, `@emotion/*`)
- **Supabase JS v2** for DB and Auth
- **TensorFlow.js** for the LSTM model
- **ml-random-forest** for the Random Forest model
- **TypeScript**

---

## 🔐 Environment

프로젝트 루트에 `.env.local` 파일을 만들고 아래 환경변수를 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE=YOUR_SUPABASE_SERVICE_ROLE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

> DHLottery API는 공개 API이므로 별도 키가 필요하지 않습니다.  
> Google 로그인은 **Supabase Auth**를 통해 처리되므로, Supabase 대시보드에서도 Google Provider를 활성화해야 합니다.

---

## 🚀 Getting Started

```bash
npm install   # or: pnpm i / yarn
npm run dev

# http://localhost:3000
```

배포 빌드:

```bash
npm run build && npm start
```

---

## 🗄 Database Schema (Supabase)

아래 SQL을 **Supabase SQL Editor**에서 실행합니다. (`README_SQL.sql` 사용 가능)

```sql
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Saved user picks
create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  numbers int[] not null check (array_length(numbers,1)=6),
  created_at timestamptz not null default now()
);
create index if not exists idx_draws_created_at on public.draws(created_at desc);
alter table public.draws enable row level security;
create policy if not exists "draws_read"   on public.draws for select using (true);
create policy if not exists "draws_insert" on public.draws for insert with check (true);
create policy if not exists "draws_delete" on public.draws for delete using (true);

-- Official results (KR Lotto 6/45)
create table if not exists public.kr_lotto_results (
  round int primary key,
  draw_date date not null,
  n1 int not null, n2 int not null, n3 int not null,
  n4 int not null, n5 int not null, n6 int not null,
  bonus int not null,
  first_prize_winners int null,
  first_prize_amount numeric null
);
create index if not exists idx_lotto_results_round on public.kr_lotto_results(round);
alter table public.kr_lotto_results enable row level security;

-- Public RLS
drop policy if exists lotto_read   on public.kr_lotto_results;
drop policy if exists lotto_insert on public.kr_lotto_results;
drop policy if exists lotto_update on public.kr_lotto_results;
drop policy if exists lotto_delete on public.kr_lotto_results;
create policy lotto_read   on public.kr_lotto_results for select using (true);
create policy lotto_insert on public.kr_lotto_results for insert with check (true);
create policy lotto_update on public.kr_lotto_results for update using (true) with check (true);
create policy lotto_delete on public.kr_lotto_results for delete using (true);
```

현재 추출 이력 배지 기능까지 쓰려면 아래 컬럼도 추가합니다.

```sql
alter table public.draws
add column if not exists extraction_method text;

alter table public.draws
add column if not exists extraction_tags text[];

update public.draws
set extraction_method = 'unknown'
where extraction_method is null;

update public.draws
set extraction_tags = '{}'::text[]
where extraction_tags is null;

alter table public.draws
alter column extraction_method set default 'unknown';

create index if not exists idx_draws_extraction_method
on public.draws (extraction_method);
```

---

## 📁 Project Structure

```text
app/
  layout.tsx                       # Root layout, favicon, Theme provider
  page.tsx                         # Main page: switches view by sidebar section
  api/dhlotto/latest/route.ts      # Finds latest round by probing API (binary search)
  api/dhlotto/batch/route.ts       # Fetch a range of rounds from DHLottery
  api/dhlotto/sync/route.ts        # Sync rounds to Supabase
  api/predictions/route.ts         # Save / list predictions
  api/predictions/check-win/route.ts # Check win result for a prediction
  api/predictions/lstm/route.ts    # LSTM warm-up and prediction endpoint
  api/predictions/random-forest/route.ts # Random Forest warm-up and prediction endpoint
  print/lotto/page.tsx             # Lotto slip-style printable popup page
  theme/
    ThemeProviderRoot.tsx          # Mode context (Light/Dark/Night) with localStorage
    ThemeRegistry.tsx              # MUI theme; night palette
components/
  AppShell.tsx                     # AppBar, mode toggle, responsive container
  AuthContext.tsx                  # Google sign-in state and admin detection
  Sidebar.tsx                      # ChatGPT-like sidebar + fold
  SidebarEdgeToggle.tsx            # Floating fold/unfold button near the logo
  NavContext.tsx                   # Sidebar section context
  NumberBall.tsx                   # Shaded ball with white text + glow
  WinningsTable.tsx                # Winning-number table
  PatternBoards.tsx                # Lotto-slip SVG boards (15 per page + Load more)
  DrawList.tsx                     # Saved picks with checkbox, badges, and delete
  DrawHistoryActions.tsx           # Bulk select / clear / delete / print toolbar
  CompareView.tsx                  # Rank aggregation + matching details
  SyncPanel.tsx                    # Sync panel with admin gating and progress
  StatBasedPanel.tsx               # Statistical extraction UI
  PatternBasedPanel.tsx            # Pattern-based extraction UI
  AiLstmPanel.tsx                  # LSTM-based extraction UI
  AiRandomForestPanel.tsx          # Random Forest-based extraction UI
  MockDrawPanel.tsx                # Simulation lotto machine UI
  lottoPrint.ts                    # Opens printable lotto slip popup
lib/
  supabaseClient.ts                # Supabase client (anon)
  supabaseAdmin.ts                 # Supabase admin client (server-side)
  lottoAiServer.ts                 # AI model cache, warm-up, and persistence orchestration
  lottoAiPersistence.ts            # Upload-folder model save/load helpers
  lottoLstm.ts                     # LSTM training, serialization, prediction
  lottoRandomForest.ts             # Random Forest training, serialization, prediction
app/actions.ts                     # Server actions used by client (fetch/insert/upsert)
public/
  favicon.ico, favicon-32.png,
  apple-touch-icon.png             # App icon set
README_SQL.sql                     # Full schema + RLS policies
```

---

## 🧠 Core Logic

### Data flow
- **Sync** -> `/api/dhlotto/latest` 로 최신 회차를 찾습니다.  
  `/api/dhlotto/batch?start=1&end=latest` 로 데이터를 가져오고,  
  `/api/dhlotto/sync` 로 `kr_lotto_results` 테이블에 upsert 합니다.
- **Picks** -> `saveDraw(numbers)` 가 `draws` 에 저장합니다.  
  목록은 최신순으로 읽고, **개별 삭제 / 일괄 삭제**를 지원합니다.
- **Rank** -> 선택된 번호를 `kr_lotto_results` 전체와 비교하여  
  `1st: 6`, `2nd: 5+bonus`, `3rd: 5`, `4th: 4`, `5th: 3` 기준으로 계산합니다.
- **AI models** -> LSTM과 Random Forest는 먼저 백그라운드 warm-up을 수행하고, 이후 메모리 캐시 또는 `Upload` 폴더의 저장 모델을 재사용합니다.

### UI behavior
- **당첨번호 보기 / 패턴 분석**: 우측 비교 패널을 숨기고 본문 영역을 넓게 사용합니다.
- **예상 번호 / 추출 모드**: 좌측에 추출 UI와 이력, 우측에 현재 선택 번호의 비교 결과를 표시합니다.
- **Pattern boards**: SVG padding + `overflow: visible` 로 선 잘림을 방지합니다.
- **Printing**: 선택한 최대 5개 번호를 전용 로또 용지 스타일 팝업으로 엽니다.
- **Simulation**: 원형 추첨통에서 공이 섞이고 하나씩 배출되며, 결과는 회차별로 누적 표시됩니다.

### Extraction algorithms
- **Random Number Extraction**
  - **Model Name**: Pseudo Random Number Generator (PRNG) based unique sampler
  - **Training Method**: No training is used. It randomly generates 6 unique numbers in the `1-45` range and then sorts them in ascending order.
- **Stat-Based Extraction**
  - **Model Name**: Rule-based cumulative statistics scorer
  - **Training Method**: No ML training is used. It scores numbers using cumulative winning history.
  - **Extraction Approach**: Selected rules such as frequent numbers, missing numbers, number-band ratio, monthly trends, and weighted bias are combined into a score-based extraction.
- **Pattern-Based Extraction**
  - **Model Name**: Historical winning-pattern heuristic predictor
  - **Training Method**: No ML training is used. It analyzes patterns such as odd/even ratio, number sum, range distribution, ending digits, and consecutive-number tendency.
  - **Extraction Approach**: It predicts the likely pattern for the current week and extracts 6 numbers that fit that pattern.
- **AI Deep Learning Extraction**
  - **Model Name**: LSTM (Long Short-Term Memory) multi-label predictor
  - **Training Method**: Historical rounds from `kr_lotto_results` are grouped into time-series windows, and the `6 winning numbers + bonus number` of each round are used as normalized inputs.
  - **Training Approach**: A 2-layer LSTM with a Dense sigmoid output learns, in multi-label form, the probability that each number will be included in the next round.
  - **Extraction Approach**: It selects 6 numbers using weighted random sampling from the top predicted probability candidates.
- **AI Machine Learning Extraction**
  - **Model Name**: Random Forest Classifier ensemble
  - **Training Method**: Features are generated from recent round windows, including per-number frequency, recent missing gap, odd/even ratio, number sum, low/mid/high range distribution, consecutive number count, and bonus overlap.
  - **Training Approach**: It trains binary Random Forest classifiers for each number from `1-45` to predict whether that number will be included in the next round.
  - **Extraction Approach**: It calculates the inclusion probability for each number and then selects 6 numbers using weighted random sampling from the top candidates.

---

## 🎛 Customization

- Default theme mode (Night) -> `ThemeProviderRoot.tsx`
- Ball color rules -> `components/NumberBall.tsx`
- Load-more step & initial count -> `components/PatternBoards.tsx`
- Sync behavior -> `app/api/dhlotto/*`
- Print layout -> `app/print/lotto/page.tsx`
- Simulation machine rendering -> `components/MockDrawPanel.tsx`

---

## 🧾 Changelog (this build)

1. **통계기반 추출**과 **패턴기반 추출** 추가
2. **AI 딥러닝 추출**과 **AI 머신러닝 추출** 추가
3. AI 모델 warm-up, 메모리 캐시, `Upload` 폴더 기반 모델 재사용 추가
4. Google 로그인 및 관리자 전용 동기화 버튼 활성화 추가
5. 추출 방식 배지와 통계기반 추출 태그 배지 추가
6. 로또 용지 스타일 출력 팝업 추가
7. **Simulation > Mock Draw** 및 회차별 누적 결과 추가
8. 무거운 화면 및 AI 초기화용 로딩 오버레이 추가
9. 사이드바 접기/툴팁/테마 스크롤바 스타일 개선

---

## 🩺 Troubleshooting

- **RLS error (`42501`) when syncing**  
  `kr_lotto_results` 에 public `insert/update/delete` 정책이 적용되어 있는지 확인하세요.
- **Build error about `secondaryAction` on `ListItemButton`**  
  MUI v6에서는 `ListItem` 이 `secondaryAction` 을 감싸는 구조여야 합니다.
- **Numbers not colored**  
  `components/NumberBall.tsx` 의 색상 매핑 구현을 확인하세요.
- **Google sign-in fails with `Unsupported provider: provider is not enabled`**  
  Supabase Auth 에서 Google Provider 를 활성화하세요.
- **Google sign-in fails with `Unable to exchange external code`**  
  Google Cloud 와 Supabase 양쪽의 OAuth Client ID / Secret / Redirect URI 설정을 확인하세요.
- **Predictions are not saved after extraction**  
  `draws.extraction_method`, `draws.extraction_tags` 컬럼이 필요한 상태인지 확인하세요.
- **Nothing shows on Winning Numbers / Pattern Analysis and only spinner**  
  먼저 **sync** 로 `kr_lotto_results` 데이터가 채워졌는지 확인하세요.

---

## 🔗 Data Source

- **DHLottery** (official KR Lotto 6/45):  
  `GET /common.do?method=getLottoNumber&drwNo={round}`

---

## 📄 License

Demo / internal use. Replace with your project's license if needed.

---

## English

[한국어로 돌아가기](#weblottonextjs)

A **responsive Lotto (KR 6/45)** web application built with **Next.js (App Router)**, **Material UI v6**, and **Supabase**.  
Generate prediction picks, compare with all historical winning numbers, explore **pattern boards** drawn on lotto slips, run **multiple extraction modes**, use a **simulation-based mock draw machine**, print lotto-slip style selections, and **synchronize** official results from **DHLottery REST API** with **Light / Dark / Night** themes and a **ChatGPT-like sidebar**.

---

## ✨ Features

- **Modes**
  - **Winning Numbers (Table)**: Descending rounds (latest first), shows 6 numbers + bonus, **#1 winner count** and **#1 prize amount** columns (if provided).
  - **Pattern Analysis (Boards)**: Fifteen mini **lotto-slip boards** per page with an **SVG polyline** that connects the 6 numbers **in draw order** (recent first). **Load more** adds 15 boards.
  - **Prediction Picks**: One-click generation, saved-pick history, **bulk select / unselect / delete / print**, extraction badges, and rank matching against the full history.
  - **Stat-Based Extraction**: Uses cumulative frequency, missing-number tendency, number-band ratio, monthly trend, and weighted rule combinations.
  - **Pattern-Based Extraction**: Predicts a likely winning pattern for the current week and extracts numbers that fit that pattern.
  - **AI Deep Learning Extraction**: Uses an LSTM-based predictor with background warm-up, in-memory cache, and persisted model reuse.
  - **AI Machine Learning Extraction**: Uses a Random Forest-based predictor with background warm-up, in-memory cache, and persisted model reuse.
  - **Simulation (Mock Draw)**: Animated circular lotto machine that mixes balls and ejects them one by one along the rail.
- **Compare & Rank**: For any selected pick, compute **1st ~ 5th** rank hits across history (2nd prize recognizes **5 matches + bonus**).
- **Full sync from source**: From **Round 1** to **latest** via  
  `GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}`  
  A progress bar shows batch progress (50 rounds per request window). Results upsert into `kr_lotto_results`.
- **Storage**: User picks are stored in `draws` (Supabase). App reload shows the latest list. Optional metadata columns can store extraction methods and tags.
- **Authentication / Permissions**
  - Google sign-in via Supabase Auth
  - Header profile toggle after login
  - Sync button can be limited to admin accounts only
- **UX / UI**
  - **Night / Dark / Light** theme toggle (icon buttons)
  - **Sidebar** with **fold** button, responsive layouts
  - **Inline loading** for heavy views (backdrop + spinner while switching to table/boards)
  - **AI model initialization overlay** for deep learning and machine learning views
  - **Color-coded number balls**: 1-10 mustard, 11-20 red/orange, 21-30 sky blue, 31-40 gray, 41-45 green
  - Number balls have **soft inner highlights** and **white text with glow**

---

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![App Router](https://img.shields.io/badge/App%20Router-enabled-blue?style=flat-square)
![Material UI](https://img.shields.io/badge/MUI-6.x-007FFF?logo=mui&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%2F%20Auth-3FCF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)

- **Next.js 15 (App Router)**, **React 18**
- **Material UI v6** (`@mui/material`, `@mui/icons-material`, `@emotion/*`)
- **Supabase JS v2** for DB and Auth
- **TensorFlow.js** for the LSTM model
- **ml-random-forest** for the Random Forest model
- **TypeScript**

---

## 🔐 Environment

Create `.env.local` at the repo root and add the required credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE=YOUR_SUPABASE_SERVICE_ROLE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

> The DHLottery API is public and does **not** require a key. Network access is server-to-origin via the app's API routes.  
> Google sign-in is handled through **Supabase Auth**, so the Google provider must also be enabled in the Supabase dashboard.

---

## 🚀 Getting Started

```bash
npm install   # or: pnpm i / yarn
npm run dev

# http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

---

## 🗄 Database Schema (Supabase)

Run the SQL below in **Supabase SQL Editor** (or use the included `README_SQL.sql`):

```sql
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Saved user picks
create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  numbers int[] not null check (array_length(numbers,1)=6),
  created_at timestamptz not null default now()
);
create index if not exists idx_draws_created_at on public.draws(created_at desc);
alter table public.draws enable row level security;
create policy if not exists "draws_read"   on public.draws for select using (true);
create policy if not exists "draws_insert" on public.draws for insert with check (true);
create policy if not exists "draws_delete" on public.draws for delete using (true);

-- Official results (KR Lotto 6/45)
create table if not exists public.kr_lotto_results (
  round int primary key,
  draw_date date not null,
  n1 int not null, n2 int not null, n3 int not null,
  n4 int not null, n5 int not null, n6 int not null,
  bonus int not null,
  first_prize_winners int null,
  first_prize_amount numeric null
);
create index if not exists idx_lotto_results_round on public.kr_lotto_results(round);
alter table public.kr_lotto_results enable row level security;

-- Public RLS
drop policy if exists lotto_read   on public.kr_lotto_results;
drop policy if exists lotto_insert on public.kr_lotto_results;
drop policy if exists lotto_update on public.kr_lotto_results;
drop policy if exists lotto_delete on public.kr_lotto_results;
create policy lotto_read   on public.kr_lotto_results for select using (true);
create policy lotto_insert on public.kr_lotto_results for insert with check (true);
create policy lotto_update on public.kr_lotto_results for update using (true) with check (true);
create policy lotto_delete on public.kr_lotto_results for delete using (true);
```

Additional columns used by the current extraction history UI:

```sql
alter table public.draws
add column if not exists extraction_method text;

alter table public.draws
add column if not exists extraction_tags text[];

update public.draws
set extraction_method = 'unknown'
where extraction_method is null;

update public.draws
set extraction_tags = '{}'::text[]
where extraction_tags is null;

alter table public.draws
alter column extraction_method set default 'unknown';

create index if not exists idx_draws_extraction_method
on public.draws (extraction_method);
```

---

## 📁 Project Structure

```text
app/
  layout.tsx
  page.tsx
  api/dhlotto/latest/route.ts
  api/dhlotto/batch/route.ts
  api/dhlotto/sync/route.ts
  api/predictions/route.ts
  api/predictions/check-win/route.ts
  api/predictions/lstm/route.ts
  api/predictions/random-forest/route.ts
  print/lotto/page.tsx
  theme/
    ThemeProviderRoot.tsx
    ThemeRegistry.tsx
components/
  AppShell.tsx
  AuthContext.tsx
  Sidebar.tsx
  SidebarEdgeToggle.tsx
  NavContext.tsx
  NumberBall.tsx
  WinningsTable.tsx
  PatternBoards.tsx
  DrawList.tsx
  DrawHistoryActions.tsx
  CompareView.tsx
  SyncPanel.tsx
  StatBasedPanel.tsx
  PatternBasedPanel.tsx
  AiLstmPanel.tsx
  AiRandomForestPanel.tsx
  MockDrawPanel.tsx
  lottoPrint.ts
lib/
  supabaseClient.ts
  supabaseAdmin.ts
  lottoAiServer.ts
  lottoAiPersistence.ts
  lottoLstm.ts
  lottoRandomForest.ts
app/actions.ts
public/
  favicon.ico
README_SQL.sql
```

---

## 🧠 Core Logic

### Data flow
- **Sync** -> `/api/dhlotto/latest` finds the latest round.  
  `/api/dhlotto/batch?start=1&end=latest` downloads JSON rows.  
  `/api/dhlotto/sync` upserts official results into `kr_lotto_results`.
- **Picks** -> `saveDraw(numbers)` inserts into `draws`.  
  The list reads from `draws` (latest first). Deleting supports **bulk** and **per-row** operations.
- **Rank** -> For a selected pick, compare against each `kr_lotto_results` row:  
  `1st: 6`, `2nd: 5+bonus`, `3rd: 5`, `4th: 4`, `5th: 3` matches.
- **AI models** -> LSTM and Random Forest warm in the background, then reuse cached or persisted models from the `Upload` folder.

### UI behavior
- **Winning Numbers / Pattern Analysis**: The right panel is hidden to maximize content. Transition shows a backdrop spinner.
- **Prediction Picks / Extraction Modes**: The right panel shows current pick and rank history; the left panel contains the extraction UI and pick list.
- **Pattern boards**: SVG padding + `overflow: visible` prevents clipped lines. **Load more** appends 15 boards each click.
- **Printing**: Up to 5 selected picks can be opened in a dedicated lotto-slip style popup page.
- **Simulation**: The mock draw machine mixes balls in a circular drum, ejects them one by one, and stores simulated round history on screen.

### Extraction algorithms
- **Random Number Extraction**
  - **Model Name**: Pseudo Random Number Generator (PRNG) based unique sampler
  - **Training Method**: No training is used. It randomly generates 6 unique numbers in the `1-45` range and then sorts them in ascending order.
- **Stat-Based Extraction**
  - **Model Name**: Rule-based cumulative statistics scorer
  - **Training Method**: No ML training is used. It scores numbers using cumulative winning history.
  - **Extraction Approach**: Selected rules such as frequent numbers, missing numbers, number-band ratio, monthly trends, and weighted bias are combined into a score-based extraction.
- **Pattern-Based Extraction**
  - **Model Name**: Historical winning-pattern heuristic predictor
  - **Training Method**: No ML training is used. It analyzes patterns such as odd/even ratio, number sum, range distribution, ending digits, and consecutive-number tendency.
  - **Extraction Approach**: It predicts the likely pattern for the current week and extracts 6 numbers that fit that pattern.
- **AI Deep Learning Extraction**
  - **Model Name**: LSTM (Long Short-Term Memory) multi-label predictor
  - **Training Method**: Historical rounds from `kr_lotto_results` are grouped into time-series windows, and the `6 winning numbers + bonus number` of each round are used as normalized inputs.
  - **Training Approach**: A 2-layer LSTM with a Dense sigmoid output learns, in multi-label form, the probability that each number will be included in the next round.
  - **Extraction Approach**: It selects 6 numbers using weighted random sampling from the top predicted probability candidates.
- **AI Machine Learning Extraction**
  - **Model Name**: Random Forest Classifier ensemble
  - **Training Method**: Features are generated from recent round windows, including per-number frequency, recent missing gap, odd/even ratio, number sum, low/mid/high range distribution, consecutive number count, and bonus overlap.
  - **Training Approach**: It trains binary Random Forest classifiers for each number from `1-45` to predict whether that number will be included in the next round.
  - **Extraction Approach**: It calculates the inclusion probability for each number and then selects 6 numbers using weighted random sampling from the top candidates.

---

## 🎛 Customization

- Default theme mode (Night) -> `ThemeProviderRoot.tsx`
- Ball color rules -> `components/NumberBall.tsx`
- Load-more step & initial count -> `components/PatternBoards.tsx`
- Sync behavior -> `app/api/dhlotto/*`
- Print layout -> `app/print/lotto/page.tsx`
- Simulation machine rendering -> `components/MockDrawPanel.tsx`

---

## 🧾 Changelog (this build)

1. Added **Stat-Based Extraction** and **Pattern-Based Extraction**
2. Added **AI Deep Learning Extraction** and **AI Machine Learning Extraction**
3. Added AI model warm-up, in-memory caching, and persisted model reuse from the `Upload` folder
4. Added Google sign-in and admin-only sync button activation
5. Added extraction method badges and stat rule tags in prediction history
6. Added printable lotto-slip popup for selected picks
7. Added **Simulation > Mock Draw** with animated lotto machine and per-round result history
8. Added loading overlays for result-heavy screens and AI model initialization
9. Improved sidebar folding behavior, tooltip support, and theme-aligned scrollbar styling

---

## 🩺 Troubleshooting

- **RLS error (`42501`) when syncing**  
  Run the provided SQL to enable public `insert/update/delete` policies on `kr_lotto_results`.
- **Build error about `secondaryAction` on `ListItemButton`**  
  Use `ListItem` (with `secondaryAction`) wrapping `ListItemButton` (MUI v6 requirement).
- **Numbers not colored**  
  Verify `components/NumberBall.tsx` implements the specified color mapping.
- **Google sign-in fails with `Unsupported provider: provider is not enabled`**  
  Enable the Google provider in Supabase Auth.
- **Google sign-in fails with `Unable to exchange external code`**  
  Verify the Google OAuth client ID, secret, and callback URI configuration in both Google Cloud and Supabase.
- **Predictions are not saved after extraction**  
  Make sure `draws.extraction_method` and `draws.extraction_tags` exist if you want full history badge support.
- **Nothing shows on Winning Numbers / Pattern Analysis and only spinner**  
  Ensure the sync step has populated `kr_lotto_results`.

---

## 🔗 Data Source

- **DHLottery** (official KR Lotto 6/45):  
  `GET /common.do?method=getLottoNumber&drwNo={round}`

---

## 📄 License

Demo / internal use. Replace with your project's license if needed.
