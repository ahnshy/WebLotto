'use client';
import * as React from 'react';
import { Card, CardContent, Stack, Typography, TextField, Button, LinearProgress, Box, Alert, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

async function getLatest(): Promise<number> {
  try {
    const r = await fetch('/api/dhlotto/latest', { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    
    // 응답이 비어있지 않은지 확인
    const text = await r.text();
    if (!text) throw new Error('Empty response from API');
    
    const j = JSON.parse(text);
    if (!j || typeof j.latest !== 'number') throw new Error('Invalid response format');
    
    return j.latest;
  } catch (e) {
    throw new Error(`Failed to fetch latest round: ${String(e)}`);
  }
}

async function syncRange(start: number, end: number, onStep: (done: number, total: number) => void) {
  try {
    const total = end - start + 1;
    const r = await fetch(`/api/dhlotto/sync?start=${start}&end=${end}`, { method: 'GET' });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    
    const text = await r.text();
    if (!text) throw new Error('Empty response from sync API');
    
    const json = JSON.parse(text);
    if (!json.success) throw new Error(json.error || 'Unknown error');
    
    onStep(json.synced, total);
    return json;
  } catch (e) {
    throw new Error(`Sync failed: ${String(e)}`);
  }
}

export default function SyncPanel() {
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');
  const [syncResult, setSyncResult] = React.useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchLatest = async () => {
      try {
        const latest = await getLatest();
        if (isMounted) {
          if (latest > 0) {
            setEnd(latest);
            setStatus('idle');
            setMessage(`최신 회차: ${latest}회`);
          } else {
            throw new Error('Invalid latest round (got 0 or negative)');
          }
        }
      } catch (e) {
        if (isMounted) {
          const errMsg = String(e);
          retryCount++;
          
          if (retryCount < maxRetries) {
            setStatus('loading');
            setMessage(`재시도 중... (${retryCount}/${maxRetries})`);
            // 지수 백오프로 재시도
            setTimeout(fetchLatest, 2000 * retryCount);
          } else {
            setStatus('error');
            setMessage(`최신 회차 조회 실패 (${maxRetries}회 재시도 후): ${errMsg}`);
            console.error('Failed to fetch latest round:', errMsg);
          }
        }
      }
    };

    fetchLatest();

    return () => {
      isMounted = false;
    };
  }, []);

  const onRun = async () => {
    if (!end || end < start) {
      setStatus('error');
      setMessage('유효한 회차 범위를 입력하세요');
      return;
    }
    
    setRunning(true);
    setProgress(0);
    setStatus('loading');
    setMessage('동기화 중...');
    setSyncResult(null);

    try {
      const result = await syncRange(start, end, (done, tot) => {
        setProgress(Math.round((done / tot) * 100));
      });
      setSyncResult(result);
      setStatus('success');
      const failMsg = result.failed > 0 ? `, ${result.failed}개 실패` : '';
      setMessage(`성공! ${result.synced}개 동기화됨${failMsg}`);
    } catch (e) {
      const errMsg = String(e);
      setStatus('error');
      setMessage(`동기화 실패: ${errMsg}`);
      console.error('Sync error:', errMsg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          로또 당첨번호 동기화
        </Typography>

        {/* 정보 메시지 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          💡 1회차부터 {end ?? '?'}회차까지 제한 없이 동기화할 수 있습니다. 배치 처리로 빠르게 진행됩니다.
        </Alert>

        {/* 상태 표시 */}
        {status !== 'idle' && (
          <Alert
            severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
            icon={status === 'loading' ? <CircularProgress size={20} /> : undefined}
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}

        {/* 입력 폼 */}
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
          <Button
            variant="contained"
            onClick={onRun}
            disabled={running || !end || status === 'loading'}
            sx={{ mt: 0.5 }}
          >
            {running ? '동기화 중...' : '동기화 시작'}
          </Button>
        </Stack>

        {/* 진행률 표시 */}
        {(running || progress > 0) && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant={running ? 'determinate' : 'determinate'}
              value={progress}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {progress}% ({start}회차 → {end}회차)
            </Typography>
          </Box>
        )}

        {/* 동기화 결과 */}
        {syncResult && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                <strong>동기화 범위:</strong> {syncResult.range.start} ~ {syncResult.range.end}회차
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                성공: {syncResult.synced}개
              </Typography>
              {syncResult.failed > 0 && (
                <Typography variant="body2" sx={{ color: 'warning.main' }}>
                  <ErrorIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  실패: {syncResult.failed}개
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
