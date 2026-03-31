import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

async function getRound(r: number) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const js = await res.json();
  if (js.returnValue !== 'success') return null;
  return {
    round: js.drwNo,
    draw_date: js.drwNoDate,
    n1: js.drwtNo1,
    n2: js.drwtNo2,
    n3: js.drwtNo3,
    n4: js.drwtNo4,
    n5: js.drwtNo5,
    n6: js.drwtNo6,
    bonus: js.bnusNo,
    first_prize_winners: js.firstWinamnt ? js.firstPrzwnerCo ?? null : null,
    first_prize_amount: js.firstWinamnt ? Number(js.firstWinamnt) : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get('start') || '1');
    const end = parseInt(searchParams.get('end') || String(start));

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let r = start; r <= end; r++) {
      try {
        const data = await getRound(r);
        if (!data) {
          failedCount++;
          continue;
        }

        // Supabase에 upsert (이미 있으면 무시)
        const { error } = await supabaseAdmin
          .from('kr_lotto_results')
          .upsert([data], { onConflict: 'round' });

        if (error) {
          failedCount++;
          errors.push(`Round ${r}: ${error.message}`);
        } else {
          syncedCount++;
        }
      } catch (e) {
        failedCount++;
        errors.push(`Round ${r}: ${String(e)}`);
      }

      // API 속도 제한 회피
      await new Promise((res) => setTimeout(res, 100));
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      range: { start, end },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}

