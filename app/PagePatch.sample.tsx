'use client';
// Sample patch showing how to render SyncPanel only for '동기화' section
import * as React from 'react';
import dynamic from 'next/dynamic';
import { Grid, Paper, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import { useNav } from '@/components/NavContext';
const SyncPanel = dynamic(()=>import('@/components/SyncPanel'),{ ssr:false });
const WinningsTable = dynamic(()=>import('@/components/WinningsTable'));
const PatternBoards = dynamic(()=>import('@/components/PatternBoards'));
const DrawList = dynamic(()=>import('@/components/DrawList'));
const CompareView = dynamic(()=>import('@/components/CompareView'));

export default function PagePatchSample(){
  const { section } = useNav();
  const [historyLoading,setHistoryLoading]=React.useState(false);
  const history:any[]=[];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md>
        <Paper sx={{p:2, position:'relative', minHeight:200}}>
          {section==='동기화' && <SyncPanel/>}
          {section==='당첨번호보기' && <WinningsTable rows={history}/>}
          {section==='당첨 패턴 분석' && <PatternBoards rows={history}/>}
          {/* 예상번호 추출 분기는 실제 프로젝트 코드에 맞게 유지 */}

          <Backdrop open={historyLoading} sx={{ position:'absolute', inset:0, color:'#fff' }}>
            <Stack alignItems='center' spacing={1}>
              <CircularProgress/>
              <Typography variant='body2'>로딩 중...</Typography>
            </Stack>
          </Backdrop>
        </Paper>
      </Grid>
    </Grid>
  );
}
