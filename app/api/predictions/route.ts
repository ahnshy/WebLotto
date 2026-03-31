import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

// 예측 번호 추가
export async function POST(req: NextRequest) {
  try {
    // 환경 변수 런타임 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { numbers } = body;

    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json(
        { error: '예측 번호는 6개여야 합니다' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('draws')
      .insert([{ numbers }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

// 예측 번호 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 환경 변수 런타임 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

