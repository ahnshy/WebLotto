# WebLottoNextjs

A responsive **KR Lotto 6/45** web application built with **Next.js App Router**, **Material UI**, and **Supabase**.

It supports official result sync, multiple extraction modes, pattern analysis, printable lottery slips, Google login, and a simulation-based lottery machine UI.

---

## Features

- **Winning Numbers View**
  - Displays historical winning rounds in descending order
  - Shows 6 winning numbers, bonus number, first-prize winner count, and first-prize amount
  - Uses a view-only loading overlay while data-heavy screens initialize

- **Pattern Analysis**
  - Renders lotto slip-style pattern boards
  - Connects winning numbers in draw order
  - Supports incremental loading for large histories

- **Extraction Modes**
  - **Random Extraction**
  - **Stat-Based Extraction**
  - **Pattern-Based Extraction**
  - **AI Deep Learning Extraction**
  - **AI Machine Learning Extraction**
  - All extracted picks are saved to history and can be compared, selected, deleted, or printed

- **Simulation**
  - Includes a mock lottery machine screen under the **Simulation** menu
  - Uses a canvas-based circular drum machine with ball motion and ejection animation
  - Shows current drawn balls as numbered lotto balls
  - Accumulates simulation history by round (`Round 1`, `Round 2`, ...)

- **Prediction History**
  - Bulk select, unselect, delete, and print actions
  - Displays extraction method badges such as `Random`, `Stat`, `Pattern`, `Deep Learning`, and `Machine Learning`
  - Stat-based extraction can also display selected rule badges

- **Printing**
  - Prints up to 5 selected picks on a lotto slip-style print layout
  - Opens a dedicated print popup
  - Includes OMR-style guide layout for test printing

- **Synchronization**
  - Syncs official results from the DHLottery API into Supabase
  - Sync action is restricted to admin Google accounts only

- **Authentication**
  - Google login via Supabase Auth
  - Header toggles between `Google Sign In` and the logged-in user profile
  - Admin-only sync button activation based on allowed email addresses

- **UI / UX**
  - Light / Dark / Night theme modes
  - ChatGPT-style collapsible sidebar
  - Logo click to reopen collapsed sidebar
  - Theme-aware loading overlays and styled scrollbars

---

## Tech Stack

- **Next.js 15**
- **React 18**
- **TypeScript**
- **Material UI**
- **Supabase**
- **TensorFlow.js** for LSTM-based prediction
- **ml-random-forest** for Random Forest prediction

---

## Environment Variables

Create `.env.local` in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

Notes:

- Google login is handled by **Supabase Auth**, so Google OAuth must also be configured in the Supabase dashboard.
- DHLottery does not require a separate API key.

---

## Getting Started

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

---

## Google OAuth Setup

### Google Cloud Console

Authorized redirect URI:

```text
https://ckrujqnmimbmufgndyil.supabase.co/auth/v1/callback
```

### Supabase Auth

Redirect URLs:

```text
http://localhost:3000
https://web-lotto-nextjs.vercel.app
```

Make sure the Google provider is enabled in:

- `Supabase Dashboard > Authentication > Providers > Google`

---

## Database Schema

Run the base schema in Supabase SQL Editor.

```sql
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  numbers int[] not null check (array_length(numbers, 1) = 6),
  created_at timestamptz not null default now()
);

create table if not exists public.kr_lotto_results (
  round int primary key,
  draw_date date not null,
  n1 int not null,
  n2 int not null,
  n3 int not null,
  n4 int not null,
  n5 int not null,
  n6 int not null,
  bonus int not null,
  first_prize_winners int null,
  first_prize_amount numeric null
);
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

Apply your existing RLS policies as needed for `draws` and `kr_lotto_results`.

---

## Extraction Algorithms

### Random Extraction

- **Model Name**: Pseudo Random Number Generator (PRNG) based unique sampler
- **Training Method**: No training is used. It randomly generates 6 unique numbers in the `1-45` range and sorts them in ascending order.

### Stat-Based Extraction

- **Model Name**: Rule-based cumulative statistics scorer
- **Training Method**: No ML training is used. It scores numbers from accumulated historical result data.
- **Supported Rule Inputs**:
  - Frequent numbers
  - Missing numbers
  - Number-range ratio
  - Monthly frequent numbers
  - Frequency-focused bias
  - Long-missing bias
- **Extraction Approach**: Selected rules are combined into weighted scores, then 6 numbers are sampled from the strongest candidates.

### Pattern-Based Extraction

- **Model Name**: Historical winning-pattern heuristic predictor
- **Training Method**: No ML training is used. It analyzes past winning-pattern structures.
- **Pattern Inputs**:
  - Odd/even ratio
  - Low/mid/high number range distribution
  - Number sum
  - Consecutive number patterns
  - Board row/column flow
  - Ending digit distribution
- **Extraction Approach**: It estimates the likely pattern for the current week and extracts 6 numbers that best match that predicted pattern.

### AI Deep Learning Extraction

- **Model Name**: LSTM (Long Short-Term Memory) multi-label predictor
- **Training Method**: Historical rounds from `kr_lotto_results` are grouped into time-series windows, and each round uses normalized winning-number sequences as input.
- **Training Approach**: A 2-layer LSTM with Dense sigmoid output learns the probability of each number appearing in the next round.
- **Extraction Approach**: It selects 6 numbers using weighted random sampling from high-probability candidates.

### AI Machine Learning Extraction

- **Model Name**: Random Forest Classifier ensemble
- **Training Method**: Features include frequency, missing gap, odd/even ratio, sum, band distribution, consecutive counts, and bonus overlap.
- **Training Approach**: Binary Random Forest classifiers are trained for numbers `1-45` to predict inclusion in the next round.
- **Extraction Approach**: It calculates per-number inclusion probabilities and samples 6 numbers from top candidates.

---

## AI Model Persistence

The AI extraction modules use persisted model files in the server-side `Upload` directory.

- LSTM model filename:
  - `1_<latestRound>_LSTM.model`
- Random Forest model filename:
  - `1_<latestRound>_RandomForest.model`

Behavior:

- On first use, the model is trained and saved
- On later requests, the saved model is loaded first
- If the latest round changes, the model is retrained and replaced
- In-memory cache is also used during the current server process lifetime

---

## Project Structure

```text
app/
  page.tsx
  layout.tsx
  actions.ts
  api/
    dhlotto/
    predictions/
  print/lotto/
components/
  AppShell.tsx
  AuthContext.tsx
  Sidebar.tsx
  SidebarEdgeToggle.tsx
  NavContext.tsx
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
  NumberBall.tsx
  lottoPrint.ts
lib/
  supabaseClient.ts
  supabaseAdmin.ts
  lottoLstm.ts
  lottoRandomForest.ts
  lottoAiServer.ts
  lottoAiPersistence.ts
```

---

## Troubleshooting

- **`SUPABASE_SERVICE_ROLE is not set`**
  - Set `SUPABASE_SERVICE_ROLE` in `.env.local` for server-side sync and model-loading features.

- **Google login fails with `Unsupported provider: provider is not enabled`**
  - Enable the Google provider in Supabase Auth.

- **Google login fails with `Unable to exchange external code`**
  - Check the Google OAuth client ID, client secret, and redirect URI configuration in both Google Cloud and Supabase.

- **Draw save fails after extraction**
  - Make sure `draws.extraction_method` and `draws.extraction_tags` columns exist if you want full history badge support.

- **Printed slip alignment is off**
  - Test with 100% print scale. OMR-style print layout still depends on printer margin and calibration.

---

## Data Source

- **DHLottery official API**
  - `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}`

---

## License

Internal / demo use unless replaced with your own project license.
