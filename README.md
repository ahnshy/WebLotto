# WebLottoNextjs

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
![Material%20UI](https://img.shields.io/badge/MUI-6.x-007FFF?logo=mui&logoColor=white)
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

Create `.env.local` at the repo root and add **Supabase** credentials:

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

```
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
- **Sync** -> `/api/dhlotto/latest` finds the latest round.  
  `/api/dhlotto/batch?start=1&end=latest` downloads JSON rows.  
  `/api/dhlotto/sync` upserts official results into `kr_lotto_results`.
- **Picks** -> `saveDraw(numbers)` inserts into `draws`.  
  The list reads from `draws` (latest first). Deleting supports **bulk** and **per-row** operations.
- **Rank** -> For a selected pick, compare against each `kr_lotto_results` row:  
  `1st: 6`, `2nd: 5+bonus`, `3rd: 5`, `4th: 4`, `5th: 3` matches.
- **AI models** -> LSTM and Random Forest warm in the background, then reuse cached or persisted models from the `Upload` folder.

### UI behavior
- **Winning Numbers / Pattern Analysis**: Right panel is **hidden** to maximize content. Transition shows a **backdrop spinner**.
- **Prediction Picks / Extraction Modes**: Right panel shows **current pick & rank history**; left panel contains the extraction UI and pick list.
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
  Ensure the **sync** step has populated `kr_lotto_results`.

---

## 🔗 Data Source

- **DHLottery** (official KR Lotto 6/45):  
  `GET /common.do?method=getLottoNumber&drwNo={round}`

---

## 📄 License

Demo / internal use. Replace with your project's license if needed.
