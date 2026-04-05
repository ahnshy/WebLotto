# WebLottoNextjs

A **responsive Lotto (KR 6/45)** web application built with **Next.js (App Router)**, **Material UI v6**, and **Supabase**.  
Generate prediction picks, compare them with all historical winning numbers, explore **pattern boards** drawn on lotto slips, run a **simulation-based mock draw machine**, print lotto slip-style output, and **synchronize** official results from the **DHLottery REST API** with **Light / Dark / Night** themes and a **ChatGPT-like sidebar**.

---

## Features

- **Modes**
  - **Winning Numbers (Table)**: Descending rounds (latest first), shows 6 numbers + bonus, **#1 winner count**, and **#1 prize amount** columns when available.
  - **Pattern Analysis (Boards)**: Lotto-slip mini boards with an **SVG polyline** connecting the 6 winning numbers **in draw order**. **Load more** appends more boards.
  - **Random Extraction**: One-click random pick generation with persistent history.
  - **Stat-Based Extraction**: Extracts numbers using selectable historical rules such as frequent numbers, missing numbers, number-band ratio, and monthly trends.
  - **Pattern-Based Extraction**: Predicts the likely pattern of the current week from historical pattern analysis and extracts numbers that fit that pattern.
  - **AI Deep Learning Extraction**: Uses an LSTM-based prediction model with warm-up, cache, and persisted model reuse.
  - **AI Machine Learning Extraction**: Uses a Random Forest-based prediction model with warm-up, cache, and persisted model reuse.
  - **Simulation (Mock Draw)**: Animated circular lottery machine that mixes balls and ejects them one by one along the rail.
- **Compare & Rank**: For any selected pick, compute **1st ~ 5th** rank hits across history (2nd prize recognizes **5 matches + bonus**).
- **Full sync from source**: From **Round 1** to **latest** via  
  `GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}`  
  A progress bar shows batch progress. Results are upserted into `kr_lotto_results`.
- **Prediction Storage & Win Checking**: User predictions are stored in the `draws` table.  
  **Win checking API** (`POST /api/predictions/check-win`) compares a prediction against any historical round and shows:
  - Number of matches (0-6)
  - Bonus number match status
  - Prize tier prediction (1st ~ 5th or loss)
- **History Management**
  - Bulk select / unselect / delete
  - Extraction method badges such as `Random`, `Stat`, `Pattern`, `Deep Learning`, and `Machine Learning`
  - Additional tags for stat-based extraction rules
  - Popup printing for up to 5 selected entries
- **Authentication & Admin Control**
  - Google sign-in via Supabase Auth
  - Header toggles between sign-in and user profile state
  - Synchronization button can be restricted to admin accounts only
- **UX / UI**
  - **Night / Dark / Light** theme toggle
  - **Sidebar** with fold / unfold behavior and logo-based reopen interaction
  - **Inline loading overlays** for heavy views
  - **AI model initialization overlay** for LSTM and Random Forest screens
  - Theme-aware custom scrollbars and polished lotto-ball rendering

---

## Tech Stack

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

## Environment

Create `.env.local` at the repo root and add the required credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE=YOUR_SUPABASE_SERVICE_ROLE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

> The DHLottery API is public and does **not** require a key.  
> Google sign-in is handled through **Supabase Auth**, so the Google provider must also be enabled in the Supabase dashboard.

---

## Getting Started

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

## Database Schema (Supabase)

Run the SQL below in **Supabase SQL Editor** (or use the included `README_SQL.sql`):

```sql
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

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

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  actions.ts
  api/dhlotto/latest/route.ts
  api/dhlotto/batch/route.ts
  api/dhlotto/sync/route.ts
  api/predictions/route.ts
  api/predictions/check-win/route.ts
  api/predictions/lstm/route.ts
  api/predictions/random-forest/route.ts
  print/lotto/page.tsx
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

## Core Logic

### Data flow
- **Sync**: `/api/dhlotto/sync?start={s}&end={e}` fetches rounds from the DHLottery API and **upserts** them into `kr_lotto_results`.
- **Predictions**: `/api/predictions` (POST) saves a 6-number array to `draws`. `/api/predictions` (GET) lists saved predictions.
- **Win Checking**: `/api/predictions/check-win` compares a prediction against a selected historical round and returns match count, bonus match, and prize-tier result.
- **History Metadata**: Extraction method and extraction tags can be stored in `draws.extraction_method` and `draws.extraction_tags`.

### UI behavior
- **Winning Numbers / Pattern Analysis**: The right panel is hidden to maximize content space.
- **Extraction Modes**: The right panel shows comparison results for the selected prediction.
- **Printing**: Selected prediction entries are opened in a dedicated lotto slip-style print popup.
- **Simulation**: The mock draw screen animates a circular drum machine and accumulates simulation rounds as ball-based result history.

### Extraction Algorithms
- **Random Number Extraction**
  - **Model Name**: Pseudo Random Number Generator (PRNG) based unique sampler
  - **Training Method**: No training is used. It randomly generates 6 unique numbers in the `1-45` range and then sorts them in ascending order.
- **Stat-Based Extraction**
  - **Model Name**: Rule-based cumulative statistics scorer
  - **Training Method**: No ML training is used. It scores numbers from cumulative historical winning data.
  - **Extraction Approach**: Selected rule options such as frequent numbers, missing numbers, number-band ratio, monthly trends, and weighted bias rules are combined to extract 6 numbers.
- **Pattern-Based Extraction**
  - **Model Name**: Historical winning-pattern heuristic predictor
  - **Training Method**: No ML training is used. It analyzes historical winning patterns such as odd/even ratio, sum, range distribution, consecutive numbers, and ending digits.
  - **Extraction Approach**: It predicts the likely pattern for the current week and extracts 6 numbers that fit that pattern.
- **AI Deep Learning Extraction**
  - **Model Name**: LSTM (Long Short-Term Memory) multi-label predictor
  - **Training Method**: Historical rounds from `kr_lotto_results` are grouped into time-series windows, and the `6 winning numbers + bonus number` of each round are used as normalized inputs.
  - **Training Approach**: A 2-layer LSTM with a Dense sigmoid output learns the probability that each number will be included in the next round.
  - **Extraction Approach**: It selects 6 numbers using weighted random sampling from the top predicted probability candidates.
- **AI Machine Learning Extraction**
  - **Model Name**: Random Forest Classifier ensemble
  - **Training Method**: Features are generated from recent round windows, including per-number frequency, recent missing gap, odd/even ratio, number sum, low/mid/high range distribution, consecutive number count, and bonus overlap.
  - **Training Approach**: It trains binary Random Forest classifiers for each number from `1-45` to predict whether that number will be included in the next round.
  - **Extraction Approach**: It calculates the inclusion probability for each number and then selects 6 numbers using weighted random sampling from the top candidates.

### AI Model Persistence
- LSTM and Random Forest models are warmed in the background.
- Models are cached in memory after initialization.
- Persisted model files are stored in the server-side `Upload` folder.
- Saved filenames follow this pattern:
  - `1_<latestRound>_LSTM.model`
  - `1_<latestRound>_RandomForest.model`

---

## Customization

- Default theme mode: `ThemeProviderRoot.tsx`
- Ball color rules: `components/NumberBall.tsx`
- Pattern board pagination: `components/PatternBoards.tsx`
- Sync behavior: `app/api/dhlotto/*`
- Print layout: `app/print/lotto/page.tsx`
- Simulation machine rendering: `components/MockDrawPanel.tsx`

---

## Changelog (v1.1.0 - Current Build)

### New Features
1. **Additional Extraction Modes**
   - Added **Stat-Based Extraction**
   - Added **Pattern-Based Extraction**
   - Added **AI Deep Learning Extraction**
   - Added **AI Machine Learning Extraction**

2. **AI Model Warm-up and Persistence**
   - Background model warm-up on screen entry
   - In-memory cache reuse
   - Persisted model files in the `Upload` folder

3. **Google Sign-In and Admin Sync Gating**
   - Google login via Supabase Auth
   - Header profile toggle after sign-in
   - Admin-only sync button activation with tooltip feedback

4. **Prediction History Improvements**
   - Extraction method badges
   - Stat-rule tag badges
   - Bulk print action

5. **Lotto Slip Printing**
   - Dedicated popup print view
   - Lotto slip-style layout for selected predictions

6. **Simulation Menu**
   - Added a mock draw machine with animated drum mixing
   - Results displayed as lotto balls
   - Round-by-round accumulated simulation history

### Fixes
- Added fallback save handling when optional DB columns are missing
- Improved OAuth redirect cleanup for repeated local sign-in attempts
- Added loading overlays for result-heavy and AI initialization screens

---

## Previous Changelog

1. **Three views wired to sidebar** (Winning table / Pattern boards / Prediction picks)
2. **Loading indicators** for heavy views (dynamic import + backdrop spinner)
3. **Right panel only for Prediction picks**
4. **Pattern boards**: paged rendering with **Load more**
5. **Floating sidebar button** repositioned near the logo
6. **Icons & favicon pack** bundled

---

## Troubleshooting

- **RLS error (`42501`) when syncing**  
  Run the provided SQL to enable public `insert/update/delete` policies on `kr_lotto_results`.
- **Google sign-in error: `Unsupported provider: provider is not enabled`**  
  Enable the Google provider in Supabase Auth.
- **Google sign-in error: `Unable to exchange external code`**  
  Verify the Google OAuth client ID, client secret, and callback URI configuration in both Google Cloud and Supabase.
- **Predictions are not saved after extraction**  
  Make sure `draws.extraction_method` and `draws.extraction_tags` exist if you want full history badge support.
- **Printed slip alignment is off**  
  Test with 100% print scale and verify printer margin settings.
- **AI extraction waits too long on first load**  
  Check that `SUPABASE_SERVICE_ROLE` is set and that model files can be created in the `Upload` folder.

---

## Data Source

- **DHLottery** (official KR Lotto 6/45):  
  `GET /common.do?method=getLottoNumber&drwNo={round}`

---

## License

Demo / internal use. Replace with your project’s license if needed.
