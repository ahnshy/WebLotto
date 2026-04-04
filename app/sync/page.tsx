'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

async function getLatest(): Promise<number> {
  const response = await fetch('/api/dhlotto/latest', { cache: 'no-store' });
  const json = await response.json();
  return json.latest ?? json.round ?? 0;
}

async function syncRange(start: number, end: number, onStep: (done: number, total: number) => void) {
  const total = end - start + 1;
  let done = 0;
  const step = 50;

  for (let current = start; current <= end; current += step) {
    const batchEnd = Math.min(end, current + step - 1);
    const response = await fetch(`/api/dhlotto/batch?start=${current}&end=${batchEnd}`, { method: 'GET' });
    if (!response.ok) throw new Error('batch failed');
    done += batchEnd - current + 1;
    onStep(done, total);
  }
}

export default function SyncPage() {
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        setEnd(await getLatest());
      } catch (e: any) {
        setError(e?.message ?? 'latest failed');
      }
    })();
  }, []);

  const onRun = async () => {
    if (!end || end < start) return;
    setRunning(true);
    setProgress(0);
    setError('');

    try {
      await syncRange(start, end, (done, total) => setProgress(Math.round((100 * done) / total)));
    } catch (e: any) {
      setError(e?.message ?? 'sync failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          동기화
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <TextField
                size="small"
                label="시작 회차"
                type="number"
                value={start}
                onChange={(event) => setStart(parseInt(event.target.value || '1', 10))}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="마지막 회차"
                type="number"
                value={end ?? ''}
                disabled
                sx={{ width: 120 }}
              />
              <Button variant="contained" onClick={onRun} disabled={running || !end}>
                동기화 시작
              </Button>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <LinearProgress variant={running ? 'determinate' : 'indeterminate'} value={progress} />
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {running && end
                  ? `${progress}% (1회차 ~ ${end}회차)`
                  : end
                    ? `대기 중 (최신 ${end}회차)`
                    : '최신 회차 확인 중...'}
              </Typography>
              {error && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  오류: {error}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
