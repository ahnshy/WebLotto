import { NextRequest, NextResponse } from 'next/server';
export const revalidate = 0;

async function getRound(r: number){
  try {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchStrLtEpsd=${r}&srchEndLtEpsd=${r}`;
    
    const res = await fetch(url, { 
      cache:'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, */*',
        'Referer': 'https://www.dhlottery.co.kr/',
      }
    });
    
    if(!res.ok) return null;
    
    const text = await res.text();
    if(!text || text.includes('<!DOCTYPE')) return null;
    
    const data = JSON.parse(text);
    let items: any[] = [];
    
    // 실제 API 응답 형식: { data: { list: [...] } }
    if (data && data.data && Array.isArray(data.data.list)) {
      items = data.data.list;
    } else if (data && Array.isArray(data.list)) {
      items = data.list;
    } else if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      items = [data];
    } else {
      return null;
    }
    
    if(items.length === 0) return null;
    
    const item = items[0];
    if(!item) return null;

    // 필드명 매핑: 새 형식 (ltEpsd, tm1WnNo~tm6WnNo, bnsWnNo, ltRflYmd)
    const roundNum = item.ltEpsd || item.drwNo || r;
    let drawDate = item.ltRflYmd || item.drwNoDate || '';
    
    // 날짜 포맷: YYYYMMDD → YYYY-MM-DD
    if (drawDate && drawDate.length === 8) {
      drawDate = `${drawDate.substring(0, 4)}-${drawDate.substring(4, 6)}-${drawDate.substring(6, 8)}`;
    }
    
    if(!roundNum || !drawDate) return null;

    const getNum = (newField: string, oldField: string) => {
      const v = item[newField] !== undefined ? item[newField] : item[oldField];
      return v ? parseInt(String(v), 10) : 0;
    };

    const getOptionalNum = (...fields: string[]) => {
      for (const field of fields) {
        const value = item[field];
        if (value === undefined || value === null || value === '') {
          continue;
        }

        const parsed = parseInt(String(value), 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
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
  } catch(e) {
    return null;
  }
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const s = parseInt(searchParams.get('start')||'1');
  const e = parseInt(searchParams.get('end')||String(s));
  const rows:any[] = [];
  for(let r=s; r<=e; r++){
    try{ 
      const one = await getRound(r); 
      if(one) rows.push(one); 
    }catch(err){}
    await new Promise(res=>setTimeout(res, 60));
  }
  return NextResponse.json({ rows, start:s, end:e });
}
