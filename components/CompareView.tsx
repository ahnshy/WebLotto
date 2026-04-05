'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NumberBall from './NumberBall';
import type { LottoRow } from '@/app/actions';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ResponsiveBallRow({
  numbers,
  bonus,
  maxSize,
}: {
  numbers: number[];
  bonus?: number;
  maxSize: number;
}) {
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const node = rowRef.current;
    if (!node) return;

    const update = () => setWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const gap = 6;
  const hasBonus = typeof bonus === 'number';
  const plusWidth = hasBonus ? 14 : 0;
  const totalBallCount = numbers.length + (hasBonus ? 1 : 0);
  const availableWidth = width || (maxSize + gap) * totalBallCount;
  const totalGapWidth = gap * Math.max(0, totalBallCount - 1);
  const computed = (availableWidth - totalGapWidth - plusWidth) / Math.max(1, totalBallCount);
  const size = clamp(Math.floor(computed), 18, maxSize);
  const plusFontSize = clamp(Math.round(size * 0.6), 12, 18);

  return (
    <Box
      ref={rowRef}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: `${gap}px`,
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {numbers.map((n, index) => (
        <NumberBall key={`${n}-${index}`} n={n} size={size} mr={0} />
      ))}
      {hasBonus && (
        <>
          <Typography sx={{ fontSize: plusFontSize, fontWeight: 700, lineHeight: 1, flex: '0 0 auto' }}>
            +
          </Typography>
          <NumberBall n={bonus} size={size} mr={0} />
        </>
      )}
    </Box>
  );
}

function rankOf(matches: number, bonus: boolean) {
  if (matches === 6) return '1등';
  if (matches === 5 && bonus) return '2등';
  if (matches === 5) return '3등';
  if (matches === 4) return '4등';
  if (matches === 3) return '5등';
  return null;
}

export default function CompareView({
  pick,
  pickId,
  history,
  ballSize,
}: {
  pick: number[] | null;
  pickId?: string | null;
  history: LottoRow[];
  ballSize: number;
}) {
  const [winCheckDialogOpen, setWinCheckDialogOpen] = React.useState(false);
  const [roundInput, setRoundInput] = React.useState('');
  const [checking, setChecking] = React.useState(false);
  const [checkResult, setCheckResult] = React.useState<any>(null);
  const [checkError, setCheckError] = React.useState('');

  if (!pick) {
    return <Typography color="text.secondary">선택된 추첨번호가 없습니다.</Typography>;
  }

  const results = history
    .map((h) => {
      const win = [h.n1, h.n2, h.n3, h.n4, h.n5, h.n6];
      const matches = pick.filter((n) => win.includes(n));
      const hasBonus = pick.includes(h.bonus);
      const rank = rankOf(matches.length, hasBonus);
      return { round: h.round, win, bonus: h.bonus, matches, rank };
    })
    .filter((x) => x.rank);

  const counts = results.reduce(
    (acc: Record<string, number>, r) => {
      if (r.rank) {
        acc[r.rank] = (acc[r.rank] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  const handleCheckWin = async () => {
    const round = parseInt(roundInput, 10);
    if (!round) {
      setCheckError('유효한 회차 번호를 입력해 주세요.');
      return;
    }

    setChecking(true);
    setCheckError('');
    setCheckResult(null);

    try {
      const res = await fetch('/api/predictions/check-win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: pickId ?? '',
          roundNumber: round,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = 'Failed to check win';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          errorMsg = `HTTP ${res.status}: ${text || 'Empty response'}`;
        }
        throw new Error(errorMsg);
      }

      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      setCheckResult(JSON.parse(text));
    } catch (e) {
      setCheckError(String(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>현재 선택 번호</Typography>
          <Box mt={1}>
            <ResponsiveBallRow numbers={pick} maxSize={ballSize} />
          </Box>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1.5 }}
            onClick={() => {
              setWinCheckDialogOpen(true);
              setRoundInput('');
              setCheckResult(null);
              setCheckError('');
            }}
          >
            당첨 여부 확인
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
            등수 집계
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} flexWrap="wrap">
            <Typography>1등 {counts['1등'] || 0}회</Typography>
            <Typography>2등 {counts['2등'] || 0}회</Typography>
            <Typography>3등 {counts['3등'] || 0}회</Typography>
            <Typography>4등 {counts['4등'] || 0}회</Typography>
            <Typography>5등 {counts['5등'] || 0}회</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      <Stack spacing={1}>
        {results.slice(0, 50).map((r) => (
          <Card key={r.round} variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={0.75}>
                  <Typography fontWeight={700}>
                    {r.round}회 {r.rank}
                  </Typography>
                  <Box sx={{ width: { xs: '100%', sm: 'min(100%, 360px)' }, minWidth: 0 }}>
                    <ResponsiveBallRow numbers={r.win} bonus={r.bonus} maxSize={ballSize} />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  일치 번호: {r.matches.length ? r.matches.join(', ') : '없음'}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={winCheckDialogOpen} onClose={() => setWinCheckDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>당첨 여부 확인</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {checkError && <Alert severity="error" sx={{ mb: 2 }}>{checkError}</Alert>}

          {!checkResult && (
            <TextField
              fullWidth
              label="회차 번호"
              type="number"
              value={roundInput}
              onChange={(e) => setRoundInput(e.target.value)}
              placeholder="예: 1150"
            />
          )}

          {checkResult && (
            <Stack spacing={1.5}>
              <Alert
                severity={checkResult.winStatus === 'win' ? 'success' : 'info'}
                icon={checkResult.winStatus === 'win' ? <CheckCircleIcon /> : <CancelIcon />}
              >
                {checkResult.winStatus === 'win'
                  ? `당첨입니다${checkResult.prizeRank ? ` (${checkResult.prizeRank})` : ''}`
                  : '낙첨입니다'}
              </Alert>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={0.75}>
                    <Typography variant="body2">
                      <strong>일치 번호 수:</strong> {checkResult.matchedCount}개
                    </Typography>
                    <Typography variant="body2">
                      <strong>보너스 일치:</strong> {checkResult.bonusMatched ? '예' : '아니오'}
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      <strong>예측 번호:</strong> {checkResult.predNumbers.join(', ')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>당첨 번호:</strong> {checkResult.winNumbers.join(', ')} + {checkResult.bonusNumber}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {checkResult && <Button onClick={() => setCheckResult(null)}>다시 확인</Button>}
          <Button onClick={() => setWinCheckDialogOpen(false)}>닫기</Button>
          {!checkResult && (
            <Button onClick={handleCheckWin} variant="contained" disabled={checking || !roundInput}>
              {checking ? <CircularProgress size={20} /> : '확인'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
