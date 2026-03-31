'use client';
import * as React from 'react';
import {
  Grid, Paper, Stack, Typography, ButtonGroup, Button,
  useMediaQuery, Backdrop, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import dynamic from 'next/dynamic';
import { fetchDraws, saveDraw, fetchLottoHistoryAll, deleteDraws, LottoRow, DrawRow } from './actions';
import { useNav } from '@/components/NavContext';
import SyncPanel from '@/components/SyncPanel';

// 기존 뷰(동적 import 유지)
const DrawList = dynamic(()=>import('@/components/DrawList'), { ssr: false });
const CompareView = dynamic(()=>import('@/components/CompareView'), { ssr: false });
const PatternBoards = dynamic(()=>import('@/components/PatternBoards'), {
  loading: ()=> <Backdrop open sx={{color:'#fff', zIndex:(t)=>t.zIndex.modal+1}}><CircularProgress/></Backdrop>,
  ssr: false
});
const WinningsTable = dynamic(()=>import('@/components/WinningsTable'), {
  loading: ()=> <Backdrop open sx={{color:'#fff', zIndex:(t)=>t.zIndex.modal+1}}><CircularProgress/></Backdrop>,
  ssr: false
});

export default function Page(){
  const [draws, setDraws] = React.useState<DrawRow[]>([]);
  const [selected, setSelected] = React.useState<DrawRow | null>(null);
  const [history, setHistory] = React.useState<LottoRow[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [loadingView, setLoadingView] = React.useState(false);
  const { section } = useNav();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdOnly = useMediaQuery(theme.breakpoints.between('sm','md'));
  const ballSize = isXs ? 22 : isMdOnly ? 28 : 36;

  React.useEffect(()=>{ (async()=>{
    try {
      const [d, h] = await Promise.all([fetchDraws(), fetchLottoHistoryAll()]);
      setDraws(d || []); 
      if(d && d.length) setSelected(d[0]); 
      setHistory(h || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setDraws([]);
      setHistory([]);
    }
  })(); }, []);

  // 무거운 뷰 전환 시만 잠깐 대기 원 표시
  React.useEffect(()=>{
    if(section==='당첨번호보기' || section==='당첨 패턴 분석'){
      setLoadingView(true);
      const t = setTimeout(()=>setLoadingView(false), 300);
      return ()=>clearTimeout(t);
    } else {
      setLoadingView(false);
    }
  }, [section]);

  const generate = ()=>{
    const s=new Set<number>();
    while(s.size<6) s.add(1+Math.floor(Math.random()*45));
    return Array.from(s).sort((a,b)=>a-b);
  };
  const onGenerate = async ()=>{
    const g=generate();
    const row = await saveDraw(g);
    setDraws(prev=>[row, ...prev]);
    setSelected(row);
  };

  const toggleCheck = (id:string)=> setChecked(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const selectAll  = ()=> setChecked(new Set(draws.map(d=>d.id)));
  const clearAll   = ()=> setChecked(new Set());
  const removeSelected = async ()=>{
    if(checked.size===0) return;
    const ids=Array.from(checked);
    await deleteDraws(ids);
    setDraws(prev=>prev.filter(d=>!checked.has(d.id)));
    if(selected && checked.has(selected.id)) setSelected(null);
    setChecked(new Set());
  };
  const removeOne = async (id:string)=>{
    await deleteDraws([id]);
    setDraws(prev=>prev.filter(d=>d.id!==id));
    if(selected?.id===id) setSelected(null);
    setChecked(prev=>{ const n=new Set(prev); n.delete(id); return n; });
  };

  // ✅ 동기화 화면: URL 이동 없이 이 페이지의 전용 단일 레이아웃으로 렌더
  if (section === '동기화') {
    return (
        <Grid container spacing={2} sx={{ flexWrap:'wrap' }}>
          <Grid item xs={12}>
            <Paper sx={{ p:2, position:'relative', minHeight: 200 }}>
              <SyncPanel/>
            </Paper>
          </Grid>
        </Grid>
    );
  }

  // 기존 2컬럼 레이아웃 (예상번호 추출일 때만 우측 비교 영역 노출)
  return (
      <Grid container spacing={2} sx={{ flexWrap:{ xs:'wrap', md:'nowrap' } }}>
        {/* LEFT */}
        <Grid item xs={12} md sx={{ order:{ xs:2, md:1 }, flexBasis:{ xs:'100%', md:580 }, flexGrow:1, minWidth:0 }}>
          <Paper sx={{ p:2, position:'relative', minHeight: 200 }}>
            {section==='당첨번호보기' && <WinningsTable rows={history} />}
            {section==='당첨 패턴 분석' && <PatternBoards rows={history} />}
            {section==='예상번호 추출' && (
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">최근 추출</Typography>
                    <Button startIcon={<AutoAwesomeIcon/>} variant="contained" onClick={onGenerate}>새로 추출</Button>
                  </Stack>

                  <ButtonGroup
                      variant="outlined" size="small" sx={{
                    alignSelf:'flex-start', borderRadius:2, overflow:'hidden', backdropFilter:'blur(6px)',
                    '& .MuiButton-root':{ textTransform:'none', fontWeight:700, px:1.5, gap:1, borderColor:'divider' },
                    '& .MuiButton-root:not(:last-of-type)':{ borderRightColor:'divider' }
                  }}>
                    <Button onClick={selectAll} startIcon={<SelectAllIcon />}>전체 선택</Button>
                    <Button onClick={clearAll} startIcon={<IndeterminateCheckBoxOutlinedIcon />}>선택 해제</Button>
                    <Button
                        color="error" onClick={removeSelected} startIcon={<DeleteSweepIcon />}
                        sx={{
                          bgcolor:(t)=> t.palette.mode==='light' ? 'error.50' : 'rgba(244,67,54,.10)',
                          '&:hover': { bgcolor:(t)=> t.palette.mode==='light' ? 'error.100' : 'rgba(244,67,54,.18)' }
                        }}>
                      선택 삭제
                    </Button>
                  </ButtonGroup>

                  <DrawList
                      ballSize={ballSize}
                      draws={draws}
                      selectedId={selected?.id ?? null}
                      onSelect={(r)=>setSelected(r)}
                      checkedIds={checked}
                      onToggleCheck={toggleCheck}
                      onDeleteOne={removeOne}
                  />
                </Stack>
            )}

            <Backdrop open={loadingView} sx={{ position:'absolute', inset:0, color:'#fff', zIndex:(t)=>t.zIndex.modal+1 }}>
              <CircularProgress />
            </Backdrop>
          </Paper>
        </Grid>

        {/* RIGHT: only for 예상번호 추출 */}
        {section==='예상번호 추출' && (
            <Grid item xs={12} md sx={{ order:{ xs:1, md:2 }, flexBasis:{ xs:'100%', md:420 }, flexGrow:0, flexShrink:0 }}>
              <Paper sx={{ p:2 }}>
                <CompareView ballSize={ballSize} pick={selected?.numbers ?? null} pickId={selected?.id ?? null} history={history} />
              </Paper>
            </Grid>
        )}
      </Grid>
  );
}
