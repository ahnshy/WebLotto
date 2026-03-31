import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

interface WinCheckRequest {
  predictionId: string;
  roundNumber: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: WinCheckRequest = await req.json();
    const { predictionId, roundNumber } = body;

    if (!predictionId || !roundNumber) {
      return NextResponse.json(
        { error: '예측 ID와 회차 번호가 필요합니다' },
        { status: 400 }
      );
    }

    // 예측 번호 조회
    const { data: prediction, error: predError } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError || !prediction) {
      return NextResponse.json(
        { error: '예측 번호를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 당첨 번호 조회
    const { data: result, error: resError } = await supabaseAdmin
      .from('kr_lotto_results')
      .select('*')
      .eq('round', roundNumber)
      .single();

    if (resError || !result) {
      return NextResponse.json(
        { error: '해당 회차의 당첨 번호를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const predNumbers = prediction.numbers.sort((a: number, b: number) => a - b);
    const winNumbers = [result.n1, result.n2, result.n3, result.n4, result.n5, result.n6].sort((a, b) => a - b);
    const bonusNumber = result.bonus;

    // 매칭된 번호 개수 계산
    let matchedCount = 0;
    for (const num of predNumbers) {
      if (winNumbers.includes(num)) {
        matchedCount++;
      }
    }

    // 보너스 번호 매칭
    const bonusMatched = predNumbers.includes(bonusNumber);

    // 당첨 상태 판정
    let winStatus = 'loss';
    if (matchedCount === 6) {
      winStatus = 'win'; // 1등
    } else if (matchedCount === 5 && bonusMatched) {
      winStatus = 'win'; // 2등
    } else if (matchedCount === 5 || (matchedCount === 4 && bonusMatched)) {
      winStatus = 'win'; // 3등 또는 4등
    } else if (matchedCount === 4 || (matchedCount === 3 && bonusMatched)) {
      winStatus = 'win'; // 4등 또는 5등
    } else if (matchedCount >= 3) {
      winStatus = 'win'; // 5등 이상
    }

    return NextResponse.json({
      success: true,
      predictionId,
      roundNumber,
      matchedCount,
      bonusMatched,
      winStatus,
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

