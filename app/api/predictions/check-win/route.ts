import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

interface WinCheckRequest {
  predictionId: string;
  roundNumber: number;
}

type PrizeRank = '1등' | '2등' | '3등' | '4등' | '5등' | '낙첨';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body: WinCheckRequest = await req.json();
    const { predictionId, roundNumber } = body;

    if (!predictionId || !roundNumber) {
      return NextResponse.json(
        { error: '예측 ID와 회차 번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: prediction, error: predError } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError || !prediction) {
      return NextResponse.json(
        { error: '예측 번호를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: result, error: resError } = await supabaseAdmin
      .from('kr_lotto_results')
      .select('*')
      .eq('round', roundNumber)
      .single();

    if (resError || !result) {
      return NextResponse.json(
        { error: '해당 회차의 당첨 번호를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const predNumbers = [...prediction.numbers].sort((a: number, b: number) => a - b);
    const winNumbers = [result.n1, result.n2, result.n3, result.n4, result.n5, result.n6].sort((a, b) => a - b);
    const bonusNumber = result.bonus;

    let matchedCount = 0;
    for (const num of predNumbers) {
      if (winNumbers.includes(num)) {
        matchedCount++;
      }
    }

    const bonusMatched = predNumbers.includes(bonusNumber);

    let prizeRank: PrizeRank = '낙첨';
    if (matchedCount === 6) {
      prizeRank = '1등';
    } else if (matchedCount === 5 && bonusMatched) {
      prizeRank = '2등';
    } else if (matchedCount === 5) {
      prizeRank = '3등';
    } else if (matchedCount === 4) {
      prizeRank = '4등';
    } else if (matchedCount === 3) {
      prizeRank = '5등';
    }

    return NextResponse.json({
      success: true,
      predictionId,
      roundNumber,
      matchedCount,
      bonusMatched,
      winStatus: prizeRank === '낙첨' ? 'loss' : 'win',
      prizeRank,
      predNumbers,
      winNumbers,
      bonusNumber,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
