# Supabase SQL Guide

## Base schema

Use [`README_SQL.sql`](D:\nextjs\WebLottoNextjs\README_SQL.sql) when creating the database from scratch.

## Incremental update

If `public.kr_lotto_results` already exists and you only need to add first-prize metadata columns, run:

- [`SUPABASE_UPDATE_KR_LOTTO_RESULTS.sql`](D:\nextjs\WebLottoNextjs\SUPABASE_UPDATE_KR_LOTTO_RESULTS.sql)

This update adds:

- `first_prize_winners int null`
- `first_prize_amount numeric null`

## After applying SQL

Run the app sync again so existing rows are backfilled.

Example:

```text
/api/dhlotto/sync?start=1&end=최신회차
```

Or sync only a target range if you do not want a full refresh.
