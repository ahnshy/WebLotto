import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stringifyError } from '@/lib/admin';

export const revalidate = 0;

async function getRoundRange(start: number, end: number): Promise<any[]> {
  try {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchStrLtEpsd=${start}&srchEndLtEpsd=${end}`;
    console.log(`[getRoundRange ${start}-${end}] Fetching: ${url}`);

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Referer': 'https://www.dhlottery.co.kr/lt645/result',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!res.ok) {
      console.log(`[getRoundRange ${start}-${end}] HTTP ${res.status}`);
      return [];
    }

    const text = await res.text();
    if (!text) {
      console.log(`[getRoundRange ${start}-${end}] Empty response`);
      return [];
    }

    if (text.trimStart().startsWith('<')) {
      console.log(`[getRoundRange ${start}-${end}] HTML response (first 200): ${text.substring(0, 200)}`);
      return [];
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.log(`[getRoundRange ${start}-${end}] JSON parse error: ${stringifyError(error)}`);
      console.log(`[getRoundRange ${start}-${end}] First 300 chars: ${text.substring(0, 300)}`);
      return [];
    }

    let items: any[] = [];
    if (data?.data?.list && Array.isArray(data.data.list)) {
      items = data.data.list;
    } else if (data?.list && Array.isArray(data.list)) {
      items = data.list;
    } else if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.includes('ltEpsd') || keys.includes('drwNo') || keys.includes('tm1WnNo') || keys.includes('drwtNo1')) {
        items = [data];
      } else {
        console.log(`[getRoundRange ${start}-${end}] Unknown structure, keys: ${keys.slice(0, 10).join(', ')}`);
        console.log(`[getRoundRange ${start}-${end}] Full response: ${text.substring(0, 500)}`);
      }
    }

    console.log(`[getRoundRange ${start}-${end}] Got ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`[getRoundRange ${start}-${end}] Error:`, stringifyError(error));
    return [];
  }
}

function parseItem(item: any, fallbackRound: number) {
  if (!item || typeof item !== 'object') return null;

  const roundNum = Number(item.ltEpsd || item.drwNo || fallbackRound);
  if (!roundNum || roundNum < 1) return null;

  let drawDate: string = item.ltRflYmd || item.drwNoDate || '';
  if (drawDate && drawDate.length === 8) {
    drawDate = `${drawDate.substring(0, 4)}-${drawDate.substring(4, 6)}-${drawDate.substring(6, 8)}`;
  }
  if (!drawDate) return null;

  const getNum = (newField: string, oldField: string): number => {
    const value = item[newField] !== undefined ? item[newField] : item[oldField];
    if (value === undefined || value === null || value === '') return 0;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  const getOptionalNum = (...fields: string[]): number | null => {
    for (const field of fields) {
      const value = item[field];
      if (value === undefined || value === null || value === '') continue;
      const parsed = parseInt(String(value), 10);
      if (!Number.isNaN(parsed)) return Math.max(0, parsed);
    }
    return null;
  };

  return {
    round: roundNum,
    draw_date: drawDate,
    n1: getNum('tm1WnNo', 'drwtNo1'),
    n2: getNum('tm2WnNo', 'drwtNo2'),
    n3: getNum('tm3WnNo', 'drwtNo3'),
    n4: getNum('tm4WnNo', 'drwtNo4'),
    n5: getNum('tm5WnNo', 'drwtNo5'),
    n6: getNum('tm6WnNo', 'drwtNo6'),
    bonus: getNum('bnsWnNo', 'bnusNo'),
    first_prize_winners: getOptionalNum('rnk1WnNope', 'firstPrzwnerCo'),
    first_prize_amount: getOptionalNum('rnk1WnAmt', 'firstWinamnt'),
  };
}

export async function GET(req: NextRequest) {
  console.log('[Sync API] ===== Request started =====');

  try {
    const supabaseClients = process.env.SUPABASE_SERVICE_ROLE ? [supabaseAdmin, supabase] : [supabase];
    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get('start') || '1', 10);
    const end = parseInt(searchParams.get('end') || String(start), 10);

    if (start < 1 || end < start || end > 10000) {
      return NextResponse.json({ success: false, error: 'Invalid range' }, { status: 400 });
    }

    console.log(`[Sync API] Sync range: ${start} ~ ${end} (${end - start + 1} rounds)`);

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const rangeSize = 100;

    for (let batchStart = start; batchStart <= end; batchStart += rangeSize) {
      const batchEnd = Math.min(batchStart + rangeSize - 1, end);
      console.log(`[Sync API] Fetching range: ${batchStart}~${batchEnd}`);

      const rawItems = await getRoundRange(batchStart, batchEnd);

      if (rawItems.length === 0) {
        const missed = batchEnd - batchStart + 1;
        failedCount += missed;
        errors.push(`Range ${batchStart}-${batchEnd}: no items returned`);
        console.log(`[Sync API] Range ${batchStart}-${batchEnd}: 0 items -> ${missed} failed`);
        continue;
      }

      const dataToInsert = rawItems
        .map((item, index) => parseItem(item, batchStart + index))
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const parseFailed = rawItems.length - dataToInsert.length;
      if (parseFailed > 0) {
        failedCount += parseFailed;
      }

      const fetchedRounds = new Set(dataToInsert.map((item) => item.round));
      for (let round = batchStart; round <= batchEnd; round += 1) {
        if (!fetchedRounds.has(round)) failedCount += 1;
      }

      if (dataToInsert.length > 0) {
        try {
          let upserted = false;
          let lastError: unknown = null;

          for (const client of supabaseClients) {
            const { error } = await client
              .from('kr_lotto_results')
              .upsert(dataToInsert, { onConflict: 'round' });

            if (!error) {
              syncedCount += dataToInsert.length;
              upserted = true;
              console.log(`[Sync API] ✓ Inserted ${dataToInsert.length} records`);
              break;
            }

            lastError = error;
            console.error('[Sync API] Supabase error:', stringifyError(error));
          }

          if (!upserted) {
            failedCount += dataToInsert.length;
            errors.push(`Upsert ${batchStart}-${batchEnd}: ${stringifyError(lastError)}`);
          }
        } catch (error) {
          console.error('[Sync API] Exception:', stringifyError(error));
          failedCount += dataToInsert.length;
          errors.push(`Exception ${batchStart}-${batchEnd}: ${stringifyError(error)}`);
        }
      }

      if (batchEnd < end) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log(`[Sync API] ===== Complete: ${syncedCount} synced, ${failedCount} failed =====`);

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      range: { start, end },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    const errMsg = stringifyError(error);
    console.error('[Sync API] Fatal error:', errMsg);
    return NextResponse.json({ success: false, error: `Server error: ${errMsg}` }, { status: 500 });
  }
}
