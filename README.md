# WebLottoNextjs

A **responsive Lotto (KR 6/45)** web application built with **Next.js (App Router)**, **Material UI v6**, and **Supabase**.  
Generate prediction picks, compare with all historical winning numbers, explore **pattern boards** drawn on lotto slips, and **synchronize** official results from **DHLottery REST API** — all with **Light / Dark / Night** themes and a **ChatGPT‑like sidebar**.

---

## ✨ Features

- **Modes**
  - **Winning Numbers (Table)**: Descending rounds (latest → 1st), shows 6 numbers + bonus, **#1 winner count** and **#1 prize amount** columns (if provided).
  - **Pattern Analysis (Boards)**: Fifteen mini **lotto‑slip boards** per page with an **SVG polyline** that connects the 6 numbers **in draw order** (recent first). **Load more** adds 15 boards.
  - **Prediction Picks**: One‑click **“Generate”** button, list of saved picks, **bulk select / unselect / delete**, and **on‑the‑fly rank matching** against the full history.
- **Compare & Rank**: For any selected pick, compute **1st ~ 5th** rank hits across history (2nd prize recognizes **5 matches + bonus**).
- **Full sync from source**: From **Round 1** to **latest** via  
  `GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round}`  
  A progress bar shows batch progress (50 rounds per request window). Results upsert into `kr_lotto_results`.
- **Storage**: User picks are stored in `draws` (Supabase). App reload shows the latest list.
- **UX / UI**
  - **Night / Dark / Light** theme toggle (icon buttons)
  - **Sidebar** with **fold** button, responsive layouts
  - **Inline loading** for heavy views (backdrop + spinner while switching to table/boards)
  - **Color‑coded number balls**: 1–10 mustard, 11–20 orange‑red, 21–30 sky, 31–40 gray, 41–45 light‑green
  - Number balls have **soft inner highlights** and **white text with glow**

---

## 🧰 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![App Router](https://img.shields.io/badge/App%20Router-enabled-blue?style=flat-square)
![Material%20UI](https://img.shields.io/badge/MUI-6.x-007FFF?logo=mui&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%2F%20Auth-3FCF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)

- **Next.js 15 (App Router)**, **React 18**
- **Material UI v6** (`@mui/material`, `@mui/icons-material`, `@emotion/*`)
- **Supabase JS v2** for DB
- **TypeScript**

---

## 🔑 Environment

Create `.env.local` at the repo root and add **Supabase** credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> The DHLottery API is public and does **not** require a key. Network access is server‑to‑origin via the app’s API routes.

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

## 🗄️ Database Schema (Supabase)

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

---

## 📁 Project Structure

```
app/
  layout.tsx                       # Root layout, favicon, Theme provider
  page.tsx                         # Main page: switches view by sidebar section
  api/dhlotto/latest/route.ts      # Finds latest round by probing API (binary search)
  api/dhlotto/batch/route.ts       # Fetch a range of rounds from DHLottery
  theme/
    ThemeProviderRoot.tsx          # Mode context (Light/Dark/Night) with localStorage
    ThemeRegistry.tsx              # MUI theme; night palette
components/
  AppShell.tsx                     # AppBar, mode toggle, responsive container
  Sidebar.tsx                      # ChatGPT-like sidebar (분석/추출/동기화) + fold
  SidebarEdgeToggle.tsx            # Floating fold/unfold button near the logo
  NavContext.tsx                   # Sidebar section context
  NumberBall.tsx                   # Shaded ball with white text + glow
  WinningsTable.tsx                # Recent→old, sticky header table
  PatternBoards.tsx                # Lotto-slip SVG boards (15 per page + Load more)
  DrawList.tsx                     # Saved picks with checkbox & per-item delete
  CompareView.tsx                  # Rank aggregation + matching details
  SyncPanel.tsx                    # Truncate + batch sync with progress
lib/
  supabaseClient.ts                # Supabase client (anon)
app/actions.ts                     # Server actions used by client (fetch/insert/upsert)
public/
  favicon.ico, favicon-32.png,
  apple-touch-icon.png             # App icon set
README_SQL.sql                     # Full schema + RLS policies
```

---

## 🧠 Core Logic

### Data flow
- **Sync** → `/api/dhlotto/latest` finds `latest` round.  
  `/api/dhlotto/batch?start=1&end=latest` downloads JSON rows (rate‑limited small delay per round).  
  Rows are **upserted** to `kr_lotto_results` in chunks.
- **Picks** → `saveDraw(numbers)` inserts into `draws`.  
  List reads from `draws` (latest first). Deleting supports **bulk** and **per‑row**.
- **Rank** → For a selected pick, compare against each `kr_lotto_results` row:  
  `1st: 6`, `2nd: 5+bonus`, `3rd: 5`, `4th: 4`, `5th: 3` matches.

### UI behavior
- **Winning Numbers / Pattern Analysis**: Right panel is **hidden** to maximize content. Transition shows a **backdrop spinner**.
- **Prediction Picks**: Right panel shows **current pick & rank history**; left panel contains **Generate** button and pick list.
- **Pattern boards**: SVG padding + `overflow: visible` prevents clipped lines. **Load more** appends 15 boards each click.

---

## 🔧 Customization

- Default theme mode (Night) → `ThemeProviderRoot.tsx`
- Balls’ color rules → `components/NumberBall.tsx`
- “Load more” step & initial count → `components/PatternBoards.tsx`
- Sync batch size (50) and delay per call → `app/api/dhlotto/batch/route.ts`

---

## 🧩 Changelog (this build)

1. **Three views wired to sidebar** (Winning table / Pattern boards / Prediction picks)
2. **Loading indicators** for heavy views (dynamic import + backdrop spinner)
3. **Right panel only for Prediction picks**
4. **Pattern boards**: no clipping, 15‑per‑page with **Load more**
5. **Floating sidebar button** repositioned near the logo (no overlap)
6. **Icons & favicon pack** bundled

---

## ❓ Troubleshooting

- **RLS error (`42501`) when syncing**  
  Run the provided SQL to enable public `insert/update/delete` policies on `kr_lotto_results`.
- **Build error about `secondaryAction` on `ListItemButton`**  
  Use `ListItem` (with `secondaryAction`) wrapping `ListItemButton` (MUI v6 requirement).
- **Numbers not colored**  
  Verify `components/NumberBall.tsx` implements the specified color mapping.
- **Nothing shows on “Winning Numbers/Pattern” and only spinner**  
  Ensure the **sync** step has populated `kr_lotto_results`.

---

## 🔗 Data Source

- **DHLottery** (official KR Lotto 6/45):  
  `GET /common.do?method=getLottoNumber&drwNo={round}`

---

## 📜 License

Demo / internal use. Replace with your project’s license if needed.
