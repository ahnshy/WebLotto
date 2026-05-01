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
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import {useLocale} from 'next-intl';
import {useAuth} from './AuthContext';

const SYNC_BATCH_SIZE = 100;

function parseJsonText(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {error: text};
  }
}

async function getLatest(): Promise<number> {
  const response = await fetch('/api/dhlotto/latest', {cache: 'no-store'});
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const text = await response.text();
  if (!text) throw new Error('Empty response from latest API');
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
  range: {start: number; end: number};
};

async function syncRangeInBatches(
  start: number,
  end: number,
  onStep: (state: {processed: number; total: number; synced: number; failed: number; batchStart: number; batchEnd: number}) => void,
): Promise<SyncSummary> {
  const total = end - start + 1;
  let synced = 0;
  let failed = 0;
  let processed = 0;
  const errors: string[] = [];

  for (let batchStart = start; batchStart <= end; batchStart += SYNC_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + SYNC_BATCH_SIZE - 1, end);
    const response = await fetch(`/api/dhlotto/sync?start=${batchStart}&end=${batchEnd}`, {method: 'GET'});

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const text = await response.text();
    if (!text) throw new Error(`Empty response from sync API for ${batchStart}-${batchEnd}`);

    const json = JSON.parse(text);
    if (!json.success) throw new Error(json.error || `Sync failed for ${batchStart}-${batchEnd}`);

    synced += json.synced ?? 0;
    failed += json.failed ?? 0;
    processed = Math.min(total, batchEnd - start + 1);

    if (Array.isArray(json.errors) && json.errors.length > 0) {
      errors.push(...json.errors);
    }

    onStep({processed, total, synced, failed, batchStart, batchEnd});
  }

  return {synced, failed, processed, total, errors, range: {start, end}};
}

export default function SyncPanel() {
  const isEn = useLocale() === 'en';
  const {email, isAdmin, loading: authLoading} = useAuth();
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState(isEn ? 'Checking the latest round.' : '최신 회차를 확인하는 중입니다.');
  const [syncResult, setSyncResult] = React.useState<SyncSummary | null>(null);
  const [currentBatch, setCurrentBatch] = React.useState<{start: number; end: number} | null>(null);
  const [buildingModel, setBuildingModel] = React.useState<'lstm' | 'randomForest' | null>(null);
  const syncDisabled = running || !end || status === 'loading' || authLoading || !isAdmin;
  const modelDisabled = buildingModel !== null || running || authLoading || !isAdmin;
  const adminTooltip = isEn ? 'Admin only.' : '관리자만 가능한 기능입니다.';

  React.useEffect(() => {
    let alive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchLatest = async () => {
      try {
        const latest = await getLatest();
        if (!alive) return;
        setEnd(latest);
        setStatus('idle');
        setMessage(isEn ? `Latest round: ${latest}` : `최신 회차: ${latest}회`);
      } catch (error) {
        if (!alive) return;
        retryCount += 1;
        const errMsg = String(error);
        if (retryCount < maxRetries) {
          setStatus('loading');
          setMessage(isEn ? `Retrying latest round... (${retryCount}/${maxRetries})` : `최신 회차 재시도 중... (${retryCount}/${maxRetries})`);
          setTimeout(fetchLatest, 2000 * retryCount);
        } else {
          setStatus('error');
          setMessage(isEn ? `Failed to fetch latest round: ${errMsg}` : `최신 회차 조회 실패: ${errMsg}`);
        }
      }
    };

    void fetchLatest();
    return () => {
      alive = false;
    };
  }, [isEn]);

  const onRun = async () => {
    if (!end || end < start) {
      setStatus('error');
      setMessage(isEn ? 'Enter a valid round range.' : '유효한 회차 범위를 입력해 주세요.');
      return;
    }

    setRunning(true);
    setProgress(0);
    setStatus('loading');
    setSyncResult(null);
    setCurrentBatch(null);
    setMessage(isEn ? 'Starting sync.' : '동기화를 시작합니다.');

    try {
      const result = await syncRangeInBatches(start, end, ({processed, total, synced, failed, batchStart, batchEnd}) => {
        setCurrentBatch({start: batchStart, end: batchEnd});
        setProgress(Math.round((processed / total) * 100));
        setMessage(isEn ? `Synced rounds ${batchStart}-${batchEnd} (${processed}/${total})` : `${batchStart}회 ~ ${batchEnd}회 동기화 완료 (${processed}/${total})`);
        setSyncResult({synced, failed, processed, total, errors: [], range: {start, end}});
      });

      setSyncResult(result);
      setStatus('success');
      setMessage(isEn ? `Sync complete: success ${result.synced}, failed ${result.failed}` : `동기화 완료: 성공 ${result.synced}회, 실패 ${result.failed}회`);
    } catch (error) {
      setStatus('error');
      setMessage(isEn ? `Sync failed: ${String(error)}` : `동기화 실패: ${String(error)}`);
    } finally {
      setRunning(false);
      setCurrentBatch(null);
    }
  };

  const handleBuildModel = async (type: 'lstm' | 'randomForest') => {
    if (!email) return;
    setBuildingModel(type);

    try {
      const endpoint = type === 'lstm' ? '/api/predictions/lstm?mode=build' : '/api/predictions/random-forest?mode=build';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });
      const text = await response.text();
      const json = parseJsonText(text);

      if (!response.ok || !json?.success) throw new Error(json?.error || `HTTP ${response.status}`);

      setStatus('success');
      setMessage(isEn ? `${type === 'lstm' ? 'Deep learning' : 'Machine learning'} model build complete: ${json.artifact.filePath}` : `${type === 'lstm' ? '딥러닝' : '머신러닝'} 모델 생성 완료: ${json.artifact.filePath}`);
    } catch (error) {
      setStatus('error');
      setMessage(isEn ? `${type === 'lstm' ? 'Deep learning' : 'Machine learning'} model build failed: ${String(error)}` : `${type === 'lstm' ? '딥러닝' : '머신러닝'} 모델 생성 실패: ${String(error)}`);
    } finally {
      setBuildingModel(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{fontWeight: 700, mb: 2}}>
            {isEn ? 'Winning Numbers Sync' : '로또 당첨번호 동기화'}
          </Typography>

          <Alert severity="info" sx={{mb: 2}}>
            {isEn ? 'Sync runs in batches of 100 rounds. Overall progress updates after each batch.' : '100회차 단위로 나누어 동기화합니다. 각 배치가 끝날 때마다 전체 진행률이 갱신됩니다.'}
          </Alert>

          {status !== 'idle' && (
            <Alert severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'} icon={status === 'loading' ? <CircularProgress size={20} /> : undefined} sx={{mb: 2}}>
              {message}
            </Alert>
          )}

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} alignItems="flex-start" sx={{mb: 2, flexWrap: 'wrap'}}>
            <TextField size="small" label={isEn ? 'Start Round' : '시작 회차'} type="number" value={start} onChange={(e) => setStart(Math.max(1, parseInt(e.target.value || '1', 10)))} sx={{width: 140}} disabled={running || authLoading || !isAdmin} />
            <TextField size="small" label={isEn ? 'End Round' : '종료 회차'} type="number" value={end ?? ''} onChange={(e) => setEnd(parseInt(e.target.value || '1', 10))} sx={{width: 140}} disabled={running || authLoading || !isAdmin} />
            <Tooltip title={!isAdmin ? adminTooltip : ''} disableHoverListener={isAdmin}>
              <span>
                <Button variant="contained" onClick={onRun} disabled={syncDisabled} sx={{mt: 0.5}}>
                  {running ? (isEn ? 'Syncing...' : '동기화 중...') : (isEn ? 'Start Sync' : '동기화 시작')}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {!authLoading && !isAdmin && (
            <Alert severity="warning" sx={{mb: 2}}>
              {email ? (isEn ? `${email} does not have sync permission.` : `${email} 계정은 동기화 권한이 없습니다.`) : (isEn ? 'Sign in with an authorized admin account to use sync.' : 'ahnshy@gmail.com 또는 ahnshy6@gmail.com 계정으로 로그인해야 동기화를 사용할 수 있습니다.')}
            </Alert>
          )}

          {(running || progress > 0) && (
            <Box sx={{mt: 2}}>
              <LinearProgress variant="determinate" value={progress} sx={{height: 10, borderRadius: 999}} />
              <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" sx={{mt: 1}}>
                <Typography variant="caption">{isEn ? `Progress ${progress}%` : `진행률 ${progress}%`}</Typography>
                <Typography variant="caption">
                  {currentBatch ? (isEn ? `Processing ${currentBatch.start}-${currentBatch.end}` : `${currentBatch.start}회 ~ ${currentBatch.end}회 처리 중`) : (isEn ? `${start}-${end}` : `${start}회 ~ ${end}회`)}
                </Typography>
              </Stack>
            </Box>
          )}

          {syncResult && (
            <Box sx={{mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1}}>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>{isEn ? 'Sync range:' : '동기화 범위:'}</strong> {syncResult.range.start} ~ {syncResult.range.end}{isEn ? '' : '회'}
                </Typography>
                <Typography variant="body2">
                  <strong>{isEn ? 'Processed rounds:' : '처리 회차:'}</strong> {syncResult.processed} / {syncResult.total}
                </Typography>
                <Typography variant="body2" sx={{color: 'success.main'}}>
                  <CheckCircleIcon sx={{fontSize: 16, mr: 0.5, verticalAlign: 'middle'}} />
                  {isEn ? `Success: ${syncResult.synced}` : `성공: ${syncResult.synced}회`}
                </Typography>
                {syncResult.failed > 0 && (
                  <Typography variant="body2" sx={{color: 'warning.main'}}>
                    <ErrorIcon sx={{fontSize: 16, mr: 0.5, verticalAlign: 'middle'}} />
                    {isEn ? `Failed: ${syncResult.failed}` : `실패: ${syncResult.failed}회`}
                  </Typography>
                )}
                {syncResult.errors.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {isEn ? `Error samples ${Math.min(syncResult.errors.length, 3)}:` : `오류 샘플 ${Math.min(syncResult.errors.length, 3)}건:`} {syncResult.errors.slice(0, 3).join(' | ')}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{fontWeight: 700, mb: 2}}>
            {isEn ? 'AI Model Build' : 'AI 모델 제작'}
          </Typography>

          <Alert severity="info" sx={{mb: 2}}>
            {isEn ? 'Builds AI model files based on the latest round and stores them in `public/ai-models`.' : '버튼을 누르면 최신 회차 기준으로 AI 모델 파일을 생성하고 `public/ai-models`에 저장합니다.'}
          </Alert>

          <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} alignItems="flex-start" sx={{flexWrap: 'wrap'}}>
            <Tooltip title={!isAdmin ? adminTooltip : ''} disableHoverListener={isAdmin}>
              <span>
                <Button variant="outlined" onClick={() => void handleBuildModel('lstm')} disabled={modelDisabled}>
                  {buildingModel === 'lstm' ? (isEn ? 'Building...' : '생성 중...') : (isEn ? 'Build Deep Learning Model' : '딥러닝 모델 생성')}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={!isAdmin ? adminTooltip : ''} disableHoverListener={isAdmin}>
              <span>
                <Button variant="outlined" onClick={() => void handleBuildModel('randomForest')} disabled={modelDisabled}>
                  {buildingModel === 'randomForest' ? (isEn ? 'Building...' : '생성 중...') : (isEn ? 'Build Machine Learning Model' : '머신러닝 모델 생성')}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {!authLoading && !isAdmin && (
            <Alert severity="warning" sx={{mt: 2}}>
              {email ? (isEn ? `${email} does not have AI model build permission.` : `${email} 계정은 AI 모델 제작 권한이 없습니다.`) : (isEn ? 'Sign in with an admin account to use AI model build.' : '관리자 계정으로 로그인해야 동기화를 사용할 수 있습니다.')}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
