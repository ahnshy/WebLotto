import { NextResponse } from 'next/server';

const FETCH_TIMEOUT = 8000; // 8초

async function fetchWithTimeout(url: string, timeout: number = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// 새로운 방식: result 페이지에서 opt_val 추출
async function getLatestFromResultPage(): Promise<number | null> {
  try {
    console.log('[API] Fetching from result page...');
    const res = await fetchWithTimeout('https://www.dhlottery.co.kr/lt645/result');
    
    if (!res.ok) {
      console.warn(`[API] Result page HTTP ${res.status}`);
      return null;
    }
    
    const html = await res.text();
    if (!html) {
      console.warn('[API] Result page empty');
      return null;
    }
    
    // id="opt_val" 또는 id='opt_val'의 value 속성 찾기
    const optValMatch = html.match(/id=['""]?opt_val['""]?\s+[^>]*value=['""]([^'"">]*)['""]|<select[^>]*id=['""]?opt_val['""]?[^>]*>[\s\S]*?<option[^>]*selected[^>]*value=['""]([^'"">]*)['""]|value=['""]([0-9]+)['""][^>]*id=['""]?opt_val['""]?/);
    
    if (optValMatch) {
      const value = optValMatch[1] || optValMatch[2] || optValMatch[3];
      if (value && value.trim()) {
        const latestRound = parseInt(value.trim(), 10);
        if (latestRound > 0) {
          console.log(`[API] Latest round from result page: ${latestRound}`);
          return latestRound;
        }
      }
    }
    
    // 더 정교한 정규식 시도
    const valueMatch = html.match(/#opt_val.*?value="([^"]*)"/) || 
                       html.match(/opt_val[^>]*value="([^"]*)"/);
    
    if (valueMatch && valueMatch[1] && valueMatch[1].trim()) {
      const latestRound = parseInt(valueMatch[1].trim(), 10);
      if (latestRound > 0) {
        console.log(`[API] Latest round from opt_val: ${latestRound}`);
        return latestRound;
      }
    }
    
    console.warn('[API] Could not extract opt_val from result page');
    return null;
  } catch (e) {
    console.error('[API] Error fetching result page:', String(e));
    return null;
  }
}

// 기존 방식: 이진 탐색 (fallback)
async function get(r: number, retries: number = 2): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${r}`;
      const res = await fetchWithTimeout(url);
      
      if (!res.ok) {
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
        return null;
      }
      
      const text = await res.text();
      if (!text) {
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
        return null;
      }
      
      const js = JSON.parse(text);
      if (js.returnValue !== 'success') {
        return null;
      }
      
      return js;
    } catch (e) {
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function GET() {
  try {
    console.log('[API] Finding latest lottery round...');
    
    // 먼저 새로운 result 페이지 방식 시도
    const latestFromPage = await getLatestFromResultPage();
    if (latestFromPage && latestFromPage > 0) {
      return NextResponse.json({ latest: latestFromPage });
    }
    
    console.log('[API] Result page method failed, falling back to binary search...');
    
    // Fallback: 이진 탐색
    let lo = 1000, hi = 2000;
    let found = false;
    
    const checkLo = await get(lo);
    const checkHi = await get(hi);
    
    console.log(`[API] Binary search: lo(${lo})=${checkLo ? 'found' : 'not found'}, hi(${hi})=${checkHi ? 'found' : 'not found'}`);
    
    if (!checkLo) {
      lo = 500;
      const checkLower = await get(lo);
      console.log(`[API] Check lower(${lo}): ${checkLower ? 'found' : 'not found'}`);
      if (!checkLower) {
        lo = 1;
      }
    }
    
    if (!checkHi) {
      hi = 3000;
      const checkUpper = await get(hi);
      console.log(`[API] Check upper(${hi}): ${checkUpper ? 'found' : 'not found'}`);
      if (!checkUpper) {
        hi = 2000;
      }
    }
    
    console.log(`[API] Binary search range: lo=${lo}, hi=${hi}`);
    
    let attempts = 0;
    const maxAttempts = 25;
    
    while (lo < hi && attempts < maxAttempts) {
      const mid = lo + Math.floor((hi - lo + 1) / 2);
      const res = await get(mid);
      if (res) {
        lo = mid;
        found = true;
      } else {
        hi = mid - 1;
      }
      attempts++;
    }
    
    console.log(`[API] Binary search result: lo=${lo}, found=${found}`);
    
    if (lo < 1 || !found) {
      console.error('[API] No valid round found');
      return NextResponse.json(
        { error: 'Could not find any valid lottery round', latest: 1 },
        { status: 200 }
      );
    }
    
    console.log(`[API] Latest round found: ${lo}`);
    return NextResponse.json({ latest: lo });
  } catch (e) {
    const errMsg = String(e);
    console.error('[API] Latest API error:', errMsg);
    return NextResponse.json(
      { error: `Failed to fetch latest: ${errMsg}`, latest: 1 },
      { status: 200 }
    );
  }
}
