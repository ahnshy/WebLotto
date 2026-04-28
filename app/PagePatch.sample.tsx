'use client';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { Grid, Paper, Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import { SECTION_IDS, useNav } from '@/components/NavContext';
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
          {section===SECTION_IDS.sync && <SyncPanel/>}
          {section===SECTION_IDS.winnings && <WinningsTable rows={history}/>}
          {section===SECTION_IDS.patternAnalysis && <PatternBoards rows={history}/>}

          <Backdrop open={historyLoading} sx={{ position:'absolute', inset:0, color:'#fff' }}>
            <Stack alignItems='center' spacing={1}>
              <CircularProgress/>
              <Typography variant='body2'>Loading...</Typography>
            </Stack>
          </Backdrop>
        </Paper>
      </Grid>
    </Grid>
  );
}
