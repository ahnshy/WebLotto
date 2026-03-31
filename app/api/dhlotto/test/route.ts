import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const round = parseInt(searchParams.get('round') || '1217', 10);

    console.log(`\n[TEST API] Testing round ${round}`);
    console.log('='.repeat(80));

    // 시도 1: selectPstLt645Info.do
    console.log(`\n[TEST 1] Trying selectPstLt645Info.do...`);
    const url1 = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchStrLtEpsd=${round}&srchEndLtEpsd=${round}`;
    
    let res1;
    let text1 = '';
    let isJson1 = false;
    
    try {
      res1 = await fetch(url1, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      text1 = await res1.text();
      isJson1 = text1.startsWith('[') || text1.startsWith('{');
      
      console.log(`Status: ${res1.status}`);
      console.log(`Content-Type: ${res1.headers.get('content-type')}`);
      console.log(`Is JSON: ${isJson1}`);
      console.log(`Response length: ${text1.length}`);
      console.log(`First 500 chars:\n${text1.substring(0, 500)}`);
      
      if (isJson1) {
        try {
          const data = JSON.parse(text1);
          console.log(`Parsed JSON type: ${Array.isArray(data) ? 'Array' : typeof data}`);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Array length: ${data.length}`);
            console.log(`First item keys: ${Object.keys(data[0]).join(', ')}`);
            console.log(`First item: ${JSON.stringify(data[0])}`);
          } else if (typeof data === 'object') {
            console.log(`Object keys: ${Object.keys(data).join(', ')}`);
            console.log(`Data: ${JSON.stringify(data)}`);
          }
        } catch (e) {
          console.log(`JSON parse error: ${String(e)}`);
        }
      }
    } catch (e) {
      console.log(`Error: ${String(e)}`);
    }

    // 시도 2: common.do API
    console.log(`\n[TEST 2] Trying common.do method...`);
    const url2 = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
    
    let res2;
    let text2 = '';
    let isJson2 = false;
    
    try {
      res2 = await fetch(url2, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      text2 = await res2.text();
      isJson2 = text2.startsWith('[') || text2.startsWith('{');
      
      console.log(`Status: ${res2.status}`);
      console.log(`Content-Type: ${res2.headers.get('content-type')}`);
      console.log(`Is JSON: ${isJson2}`);
      console.log(`Response length: ${text2.length}`);
      console.log(`First 500 chars:\n${text2.substring(0, 500)}`);
      
      if (isJson2) {
        try {
          const data = JSON.parse(text2);
          console.log(`Parsed JSON: ${JSON.stringify(data)}`);
        } catch (e) {
          console.log(`JSON parse error: ${String(e)}`);
        }
      }
    } catch (e) {
      console.log(`Error: ${String(e)}`);
    }

    console.log('='.repeat(80));

    return NextResponse.json({
      test: 'completed',
      round,
      urls: {
        selectPstLt645Info: {
          url: url1,
          status: res1?.status,
          isJson: isJson1,
          preview: text1.substring(0, 300),
        },
        commonDo: {
          url: url2,
          status: res2?.status,
          isJson: isJson2,
          preview: text2.substring(0, 300),
        },
      },
    });
  } catch (e) {
    console.error('[TEST API] Fatal error:', String(e));
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

