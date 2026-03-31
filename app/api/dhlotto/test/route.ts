import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundStr = searchParams.get('round') || '1217';
    const round = parseInt(roundStr, 10);

    console.log(`[Test API] Fetching round ${round}`);

    // 새로운 URL로 테스트
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchStrLtEpsd=${round}&srchEndLtEpsd=${round}`;
    console.log(`[Test API] URL: ${url}`);

    const res = await fetch(url, { cache: 'no-store' });
    console.log(`[Test API] Response status: ${res.status}`);

    if (!res.ok) {
      return NextResponse.json({
        error: `HTTP ${res.status}`,
        status: res.status,
      }, { status: 200 });
    }

    const text = await res.text();
    console.log(`[Test API] Response length: ${text.length}`);
    console.log(`[Test API] First 500 chars: ${text.substring(0, 500)}`);

    // JSON 파싱 시도
    try {
      const data = JSON.parse(text);
      console.log(`[Test API] Parsed data:`, JSON.stringify(data, null, 2).substring(0, 1000));
      
      return NextResponse.json({
        success: true,
        rawData: data,
        type: Array.isArray(data) ? 'array' : typeof data,
        length: Array.isArray(data) ? data.length : 'N/A',
        keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 20) : [],
      });
    } catch (parseErr) {
      console.log(`[Test API] JSON parse error:`, String(parseErr));
      return NextResponse.json({
        error: 'JSON parse error',
        details: String(parseErr),
        responseText: text.substring(0, 1000),
      });
    }
  } catch (e) {
    const errMsg = String(e);
    console.error('[Test API] Error:', errMsg);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

