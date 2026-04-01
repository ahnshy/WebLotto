import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

// 범위로 여러 회차 한번에 가져오기
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
    } catch (e) {
      console.log(`[getRoundRange ${start}-${end}] JSON parse error: ${String(e)}`);
      console.log(`[getRoundRange ${start}-${end}] First 300 chars: ${text.substring(0, 300)}`);
      return [];
    }

    let items: any[] = [];
    // 구조 1: { data: { list: [...] } }
    if (data?.data?.list && Array.isArray(data.data.list)) {
      items = data.data.list;
    }
    // 구조 2: { list: [...] }
    else if (data?.list && Array.isArray(data.list)) {
      items = data.list;
    }
    // 구조 3: 배열 직접
    else if (Array.isArray(data)) {
      items = data;
    }
    // 구조 4: 단일 객체
    else if (data && typeof data === 'object') {
      // 단일 회차인 경우 배열로 래핑
      const keys = Object.keys(data);
      if (keys.includes('ltEpsd') || keys.includes('drwNo') || keys.includes('tm1WnNo') || keys.includes('drwtNo1')) {
        items = [data];
      } else {
        console.log(`[getRoundRange ${start}-${end}] Unknown structure, keys: ${keys.slice(0, 10).join(', ')}`);
        // 응답 전체 로깅 (처음 500자)
        console.log(`[getRoundRange ${start}-${end}] Full response: ${text.substring(0, 500)}`);
      }
    }

    console.log(`[getRoundRange ${start}-${end}] Got ${items.length} items`);
    return items;
  } catch (e) {
    console.error(`[getRoundRange ${start}-${end}] Error:`, String(e));
    return [];
  }
}

function parseItem(item: any, fallbackRound: number): {
  round: number; draw_date: string;
  n1: number; n2: number; n3: number; n4: number; n5: number; n6: number;
  bonus: number;
  first_prize_winners: number | null;
  first_prize_amount: number | null;
} | null {
  if (!item || typeof item !== 'object') return null;

  const roundNum = Number(item.ltEpsd || item.drwNo || fallbackRound);
  if (!roundNum || roundNum < 1) return null;

  let drawDate: string = item.ltRflYmd || item.drwNoDate || '';
  if (drawDate && drawDate.length === 8) {
    drawDate = `${drawDate.substring(0, 4)}-${drawDate.substring(4, 6)}-${drawDate.substring(6, 8)}`;
  }
  if (!drawDate) return null;

  const getNum = (newF: string, oldF: string): number => {
    const val = item[newF] !== undefined ? item[newF] : item[oldF];
    if (val === undefined || val === null || val === '') return 0;
    const n = parseInt(String(val), 10);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  const getOptionalNum = (...fields: string[]): number | null => {
    for (const field of fields) {
      const val = item[field];
      if (val === undefined || val === null || val === '') {
        continue;
      }

      const n = parseInt(String(val), 10);
      if (!isNaN(n)) {
        return Math.max(0, n);
      }
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
    let supabaseClient: any;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

    if (serviceKey) {
      supabaseClient = supabaseAdmin;
      console.log('[Sync API] Using service role');
    } else {
      const { createClient } = require('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anonKey) {
        return NextResponse.json({ success: false, error: 'Missing Supabase configuration' }, { status: 500 });
      }
      supabaseClient = createClient(url, anonKey);
      console.log('[Sync API] Using anon key');
    }

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
    const rangeSize = 100; // 한 번에 100회차씩 범위 요청

    for (let batchStart = start; batchStart <= end; batchStart += rangeSize) {
      const batchEnd = Math.min(batchStart + rangeSize - 1, end);
      console.log(`[Sync API] Fetching range: ${batchStart}~${batchEnd}`);

      const rawItems = await getRoundRange(batchStart, batchEnd);

      if (rawItems.length === 0) {
        const missed = batchEnd - batchStart + 1;
        failedCount += missed;
        errors.push(`Range ${batchStart}-${batchEnd}: no items returned`);
        console.log(`[Sync API] Range ${batchStart}-${batchEnd}: 0 items → ${missed} failed`);
        continue;
      }

      const dataToInsert = rawItems
        .map((item, i) => parseItem(item, batchStart + i))
        .filter((d): d is NonNullable<typeof d> => d !== null);

      const parseFailed = rawItems.length - dataToInsert.length;
      if (parseFailed > 0) {
        failedCount += parseFailed;
        console.log(`[Sync API] Parse failed: ${parseFailed} items`);
      }

      // 범위에서 누락된 회차 계산
      const fetchedRounds = new Set(dataToInsert.map(d => d.round));
      for (let r = batchStart; r <= batchEnd; r++) {
        if (!fetchedRounds.has(r)) failedCount++;
      }

      if (dataToInsert.length > 0) {
        try {
          console.log(`[Sync API] Inserting ${dataToInsert.length} records...`);
          const { error } = await supabaseClient
            .from('kr_lotto_results')
            .upsert(dataToInsert, { onConflict: 'round' });

          if (error) {
            console.error(`[Sync API] Supabase error:`, error);
            failedCount += dataToInsert.length;
            errors.push(`Upsert ${batchStart}-${batchEnd}: ${error.message}`);
          } else {
            syncedCount += dataToInsert.length;
            console.log(`[Sync API] ✓ Inserted ${dataToInsert.length} records`);
          }
        } catch (e) {
          console.error(`[Sync API] Exception:`, String(e));
          failedCount += dataToInsert.length;
          errors.push(`Exception ${batchStart}-${batchEnd}: ${String(e)}`);
        }
      }

      if (batchEnd < end) {
        await new Promise(res => setTimeout(res, 200));
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
  } catch (e) {
    const errMsg = String(e);
    console.error('[Sync API] Fatal error:', errMsg);
    return NextResponse.json({ success: false, error: `Server error: ${errMsg}` }, { status: 500 });
  }
}
