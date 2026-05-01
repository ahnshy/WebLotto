'use client';

import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import {useLocale} from 'next-intl';
import NumberBall from './NumberBall';
import type {DrawRow} from '@/app/actions';

type PredictionResponse = {
  success: boolean;
  draw: DrawRow;
  prediction: {
    numbers: number[];
    topCandidates: Array<{number: number; probability: number}>;
    metrics: {
      windowSize: number;
      epochs: number;
      sampleCount: number;
      trainedRounds: number;
      loss: number | null;
      valLoss: number | null;
      elapsedMs: number;
    };
  };
  status?: ModelStatus;
};

type ModelStatus = {
  success?: boolean;
  ready: boolean;
  training: boolean;
  latestRound: number | null;
  trainedAt: number | null;
};

export default function AiLstmPanel({
  ballSize,
  onGenerated,
  onWarmStateChange,
  ownerId,
  ownerEmail,
}: {
  ballSize: number;
  onGenerated: (row: DrawRow) => void;
  onWarmStateChange?: (warming: boolean) => void;
  ownerId?: string | null;
  ownerEmail?: string | null;
}) {
  const isEn = useLocale() === 'en';
  const [running, setRunning] = React.useState(false);
  const [warming, setWarming] = React.useState(true);
  const [status, setStatus] = React.useState<ModelStatus | null>(null);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<PredictionResponse | null>(null);

  React.useEffect(() => {
    onWarmStateChange?.(warming);
  }, [warming, onWarmStateChange]);

  React.useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const res = await fetch('/api/predictions/lstm', {method: 'GET', cache: 'no-store'});
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!active) return;
        setStatus(json);
        setWarming(!json?.ready);
        if (!json?.ready) timer = setTimeout(poll, 3000);
      } catch (e) {
        if (active) {
          setError(String(e));
          setWarming(false);
        }
      }
    };

    void poll();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleGenerate = async () => {
    setRunning(true);
    setError('');

    try {
      const res = await fetch('/api/predictions/lstm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ownerId, ownerEmail}),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setResult(json);
      setStatus(json.status ?? status);
      onGenerated(json.draw);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.25}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} spacing={1}>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{fontWeight: 700}}>
                  {isEn ? 'AI Deep Learning Draw' : 'AI 딥러닝 추출'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isEn ? 'LSTM learns round history as a time series and predicts the next number combination.' : 'LSTM이 회차 이력을 시계열로 학습해 다음 번호 조합을 예측합니다.'}
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PsychologyAltIcon />}
                onClick={handleGenerate}
                disabled={running || warming}
                sx={{alignSelf: {xs: 'stretch', sm: 'auto'}}}
              >
                {warming ? (isEn ? 'Preparing model...' : '모델 준비 중...') : running ? (isEn ? 'Generating...' : '추출 중...') : (isEn ? 'AI Deep Learning Draw' : 'AI 딥러닝 추출')}
              </Button>
            </Stack>

            <Alert severity="info">
              {isEn ? 'The model is trained only once at first, then cached LSTM weights are reused for faster generation.' : '최초 1회만 모델을 학습하고, 이후에는 캐시된 LSTM 모델로 바로 번호를 추출합니다.'}
            </Alert>

            {warming && (
              <Alert severity="warning">
                {isEn ? 'The LSTM model is being prepared in the background. The button will enable automatically when ready.' : 'LSTM 모델을 백그라운드에서 준비 중입니다. 준비가 끝나면 버튼이 자동으로 활성화됩니다.'}
              </Alert>
            )}

            {status?.ready && (
              <Alert severity="success">
                {isEn ? `Model ready · latest trained round ${status.latestRound ?? '-'}` : `모델 준비 완료 · 최신 학습 회차 ${status.latestRound ?? '-'}`}
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {result && (
              <Stack spacing={1.25}>
                <Divider />
                <Stack spacing={0.75}>
                  <Typography variant="body2" sx={{fontWeight: 700}}>
                    {isEn ? 'Predicted Numbers' : '예측 번호'}
                  </Typography>
                  <Stack direction="row" sx={{flexWrap: 'wrap', gap: 0.5}}>
                    {result.prediction.numbers.map((n) => (
                      <NumberBall key={n} n={n} size={ballSize} mr={0} />
                    ))}
                  </Stack>
                </Stack>

                <Stack direction={{xs: 'column', md: 'row'}} spacing={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    {isEn ? `Trained rounds ${result.prediction.metrics.trainedRounds}` : `학습 회차 ${result.prediction.metrics.trainedRounds}개`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isEn ? `Samples ${result.prediction.metrics.sampleCount}` : `샘플 ${result.prediction.metrics.sampleCount}개`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isEn ? `Window ${result.prediction.metrics.windowSize}` : `윈도우 ${result.prediction.metrics.windowSize}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    epochs {result.prediction.metrics.epochs}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isEn ? `Elapsed ${Math.round(result.prediction.metrics.elapsedMs / 100) / 10}s` : `소요 ${Math.round(result.prediction.metrics.elapsedMs / 100) / 10}s`}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {isEn ? 'Top candidates' : '상위 후보'}: {result.prediction.topCandidates.map((item) => `${item.number}(${(item.probability * 100).toFixed(1)}%)`).join(', ')}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
