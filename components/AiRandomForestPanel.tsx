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
import HubIcon from '@mui/icons-material/Hub';
import NumberBall from './NumberBall';
import type { DrawRow } from '@/app/actions';

type PredictionResponse = {
  success: boolean;
  draw: DrawRow;
  prediction: {
    numbers: number[];
    topCandidates: Array<{ number: number; probability: number }>;
    metrics: {
      windowSize: number;
      sampleCount: number;
      trainedRounds: number;
      estimators: number;
      featureCount: number;
    };
  };
};

type ModelStatus = {
  success?: boolean;
  ready: boolean;
  training: boolean;
  latestRound: number | null;
  trainedAt: number | null;
};

export default function AiRandomForestPanel({
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
        const res = await fetch('/api/predictions/random-forest', { method: 'GET', cache: 'no-store' });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!active) return;
        setStatus(json);
        setWarming(!json?.ready);
        if (!json?.ready) {
          timer = setTimeout(poll, 3000);
        }
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
      const res = await fetch('/api/predictions/random-forest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, ownerEmail }),
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
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  AI 머신러닝 추출
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Random Forest가 번호 빈도, 홀짝 비율, 번호합, 구간 분포 같은 feature를 기반으로 확률이 높은 번호를 예측합니다.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={running ? <CircularProgress size={18} color="inherit" /> : <HubIcon />}
                onClick={handleGenerate}
                disabled={running || warming}
                sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                {warming ? '모델 준비 중...' : running ? '추출 중...' : 'AI 머신러닝 추출'}
              </Button>
            </Stack>

            <Alert severity="info">
              최초 1회만 Random Forest 모델을 준비하고, 이후에는 캐시된 모델로 즉시 예측합니다.
            </Alert>

            {warming && (
              <Alert severity="warning">
                Random Forest 모델을 백그라운드에서 준비 중입니다. 준비가 끝나면 버튼이 자동으로 활성화됩니다.
              </Alert>
            )}

            {status?.ready && (
              <Alert severity="success">
                {`모델 준비 완료 · 최신 학습 회차 ${status.latestRound ?? '-'}회`}
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {result && (
              <Stack spacing={1.25}>
                <Divider />
                <Stack spacing={0.75}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    예측 번호
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {result.prediction.numbers.map((n) => (
                      <NumberBall key={n} n={n} size={ballSize} mr={0} />
                    ))}
                  </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    학습 회차 {result.prediction.metrics.trainedRounds}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    샘플 {result.prediction.metrics.sampleCount}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    윈도우 {result.prediction.metrics.windowSize}회
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    트리 {result.prediction.metrics.estimators}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    feature {result.prediction.metrics.featureCount}개
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  상위 후보: {result.prediction.topCandidates.map((item) => `${item.number}(${(item.probability * 100).toFixed(1)}%)`).join(', ')}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
