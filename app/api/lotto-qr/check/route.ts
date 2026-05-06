import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stringifyError } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PrizeRank = '1st' | '2nd' | '3rd' | '4th' | '5th' | 'No win';

type LottoResultRow = {
  round: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number;
};

function normalizeQrPayload(raw: string) {
  const value = raw.trim();
  if (!value) throw new Error('QR data is empty.');

  try {
    const url = new URL(value);
    return url.searchParams.get('v') ?? value;
  } catch {
    const match = value.match(/[?&]v=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : value;
  }
}

function parseNumbers(segment: string) {
  const digits = segment.replace(/\D/g, '');
  if (digits.length < 12) return null;

  const numbers = Array.from({ length: 6 }, (_, index) => Number(digits.slice(index * 2, index * 2 + 2)));
  const unique = new Set(numbers);

  if (numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 45) || unique.size !== 6) {
    return null;
  }

  return [...numbers].sort((a, b) => a - b);
}

function parseLottoQr(raw: string) {
  const payload = normalizeQrPayload(raw);
  const segments = payload.split('q').map((part) => part.trim()).filter(Boolean);
  const roundMatch = segments[0]?.match(/\d{3,5}/);
  const round = roundMatch ? Number(roundMatch[0]) : null;

  if (!round || round < 1) {
    throw new Error('QR data does not include a valid lotto round.');
  }

  const games = segments
    .slice(1)
    .map(parseNumbers)
    .filter((numbers): numbers is number[] => Boolean(numbers));

  if (games.length === 0) {
    throw new Error('QR data does not include valid lotto number sets.');
  }

  return { round, games };
}

function checkPrize(numbers: number[], result: LottoResultRow) {
  const winNumbers = [result.n1, result.n2, result.n3, result.n4, result.n5, result.n6].sort((a, b) => a - b);
  const matchedNumbers = numbers.filter((number) => winNumbers.includes(number));
  const matchedCount = matchedNumbers.length;
  const bonusMatched = numbers.includes(result.bonus);

  let prizeRank: PrizeRank = 'No win';
  if (matchedCount === 6) prizeRank = '1st';
  else if (matchedCount === 5 && bonusMatched) prizeRank = '2nd';
  else if (matchedCount === 5) prizeRank = '3rd';
  else if (matchedCount === 4) prizeRank = '4th';
  else if (matchedCount === 3) prizeRank = '5th';

  return {
    numbers,
    matchedNumbers,
    matchedCount,
    bonusMatched,
    prizeRank,
    winStatus: prizeRank === 'No win' ? 'loss' : 'win',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const qrText = typeof body?.qrText === 'string' ? body.qrText : '';
    const parsed = parseLottoQr(qrText);

    const { data, error } = await supabaseAdmin
      .from('kr_lotto_results')
      .select('*')
      .eq('round', parsed.round)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Round ${parsed.round} winning numbers are not synced yet.` },
        { status: 404 }
      );
    }

    const result = data as LottoResultRow;
    const winNumbers = [result.n1, result.n2, result.n3, result.n4, result.n5, result.n6].sort((a, b) => a - b);
    const games = parsed.games.map((numbers, index) => ({
      index: index + 1,
      ...checkPrize(numbers, result),
    }));

    return NextResponse.json({
      success: true,
      round: parsed.round,
      drawDate: result.draw_date,
      winNumbers,
      bonusNumber: result.bonus,
      games,
      totalGames: games.length,
      winningGames: games.filter((game) => game.winStatus === 'win').length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: stringifyError(error) },
      { status: 400 }
    );
  }
}
