'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const SYNC_BATCH_SIZE = 100;

async function getLatest(): Promise<number> {
  const response = await fetch('/api/dhlotto/latest', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error('Empty response from latest API');
  }

  const json = JSON.parse(text);
  if (!json || typeof json.latest !== 'number' || json.latest < 1) {
    throw new Error('Invalid latest round response');
  }

  return json.latest;
}

type SyncSummary = {
  synced: number;
  failed: number;
  processed: number;
  total: number;
  errors: string[];
  range: { start: number; end: number };
};

async function syncRangeInBatches(
  start: number,
  end: number,
  onStep: (state: { processed: number; total: number; synced: number; failed: number; batchStart: number; batchEnd: number }) => void,
): Promise<SyncSummary> {
  const total = end - start + 1;
  let synced = 0;
  let failed = 0;
  let processed = 0;
  const errors: string[] = [];

  for (let batchStart = start; batchStart <= end; batchStart += SYNC_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + SYNC_BATCH_SIZE - 1, end);
    const response = await fetch(`/api/dhlotto/sync?start=${batchStart}&end=${batchEnd}`, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error(`Empty response from sync API for ${batchStart}-${batchEnd}`);
    }

    const json = JSON.parse(text);
    if (!json.success) {
      throw new Error(json.error || `Sync failed for ${batchStart}-${batchEnd}`);
    }

    synced += json.synced ?? 0;
    failed += json.failed ?? 0;
    processed = Math.min(total, batchEnd - start + 1);

    if (Array.isArray(json.errors) && json.errors.length > 0) {
      errors.push(...json.errors);
    }

    onStep({ processed, total, synced, failed, batchStart, batchEnd });
  }

  return {
    synced,
    failed,
    processed,
    total,
    errors,
    range: { start, end },
  };
}

export default function SyncPanel() {
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('최신 회차를 확인하는 중입니다.');
  const [syncResult, setSyncResult] = React.useState<SyncSummary | null>(null);
  const [currentBatch, setCurrentBatch] = React.useState<{ start: number; end: number } | null>(null);

  React.useEffect(() => {
    let alive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchLatest = async () => {
      try {
        const latest = await getLatest();
        if (!alive) {
          return;
        }

        setEnd(latest);
        setStatus('idle');
        setMessage(`최신 회차: ${latest}회`);
      } catch (error) {
        if (!alive) {
          return;
        }

        retryCount += 1;
        const errMsg = String(error);
        if (retryCount < maxRetries) {
          setStatus('loading');
          setMessage(`최신 회차 재시도 중... (${retryCount}/${maxRetries})`);
          setTimeout(fetchLatest, 2000 * retryCount);
        } else {
          setStatus('error');
          setMessage(`최신 회차 조회 실패: ${errMsg}`);
        }
      }
    };

    fetchLatest();
    return () => {
      alive = false;
    };
  }, []);

  const onRun = async () => {
    if (!end || end < start) {
      setStatus('error');
      setMessage('유효한 회차 범위를 입력해 주세요.');
      return;
    }

    setRunning(true);
    setProgress(0);
    setStatus('loading');
    setSyncResult(null);
    setCurrentBatch(null);
    setMessage('동기화를 시작합니다.');

    try {
      const result = await syncRangeInBatches(start, end, ({ processed, total, synced, failed, batchStart, batchEnd }) => {
        setCurrentBatch({ start: batchStart, end: batchEnd });
        setProgress(Math.round((processed / total) * 100));
        setMessage(`${batchStart}회 ~ ${batchEnd}회 동기화 완료 (${processed}/${total})`);
        setSyncResult({
          synced,
          failed,
          processed,
          total,
          errors: [],
          range: { start, end },
        });
      });

      setSyncResult(result);
      setStatus('success');
      setMessage(`동기화 완료: 성공 ${result.synced}회, 실패 ${result.failed}회`);
    } catch (error) {
      setStatus('error');
      setMessage(`동기화 실패: ${String(error)}`);
    } finally {
      setRunning(false);
      setCurrentBatch(null);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          로또 당첨번호 동기화
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          100회차 단위로 나누어 동기화합니다. 각 배치가 끝날 때마다 전체 진행률이 갱신됩니다.
        </Alert>

        {status !== 'idle' && (
          <Alert
            severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
            icon={status === 'loading' ? <CircularProgress size={20} /> : undefined}
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="시작 회차"
            type="number"
            value={start}
            onChange={(e) => setStart(Math.max(1, parseInt(e.target.value || '1', 10)))}
            sx={{ width: 120 }}
            disabled={running}
          />
          <TextField
            size="small"
            label="종료 회차"
            type="number"
            value={end ?? ''}
            onChange={(e) => setEnd(parseInt(e.target.value || '1', 10))}
            sx={{ width: 120 }}
            disabled={running}
          />
          <Button variant="contained" onClick={onRun} disabled={running || !end || status === 'loading'} sx={{ mt: 0.5 }}>
            {running ? '동기화 중...' : '동기화 시작'}
          </Button>
        </Stack>

        {(running || progress > 0) && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption">진행률 {progress}%</Typography>
              <Typography variant="caption">
                {currentBatch ? `${currentBatch.start}회 ~ ${currentBatch.end}회 처리 중` : `${start}회 ~ ${end}회`}
              </Typography>
            </Stack>
          </Box>
        )}

        {syncResult && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                <strong>동기화 범위:</strong> {syncResult.range.start} ~ {syncResult.range.end}회
              </Typography>
              <Typography variant="body2">
                <strong>처리 회차:</strong> {syncResult.processed} / {syncResult.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                성공: {syncResult.synced}회
              </Typography>
              {syncResult.failed > 0 && (
                <Typography variant="body2" sx={{ color: 'warning.main' }}>
                  <ErrorIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  실패: {syncResult.failed}회
                </Typography>
              )}
              {syncResult.errors.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  오류 샘플 {Math.min(syncResult.errors.length, 3)}건: {syncResult.errors.slice(0, 3).join(' | ')}
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
