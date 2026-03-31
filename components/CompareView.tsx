'use client';
import * as React from 'react';
import { Card, CardContent, Divider, Stack, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NumberBall from './NumberBall';
import type { LottoRow } from '@/app/actions';

function rankOf(m: number, bonus: boolean) {
  if (m === 6) return '1등';
  if (m === 5 && bonus) return '2등';
  if (m === 5) return '3등';
  if (m === 4) return '4등';
  if (m === 3) return '5등';
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

  if (!pick)
    return <Typography color="text.secondary">선택된 추첨번호가 없습니다.</Typography>;

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
    (acc: Record<string, number>, r: any) => {
      acc[r.rank!] = (acc[r.rank!] || 0) + 1;
      return acc;
    },
    {}
  );

  const handleCheckWin = async () => {
    const round = parseInt(roundInput, 10);
    if (!round) {
      setCheckError('유효한 회차 번호를 입력하세요');
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
      const json = JSON.parse(text);
      setCheckResult(json);
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
          <Typography variant="subtitle2">현재 선택 번호</Typography>
          <Stack direction="row" mt={1} sx={{ flexWrap: 'nowrap', whiteSpace: 'nowrap', overflowX: 'auto' }}>
            {pick.map((n) => (
              <NumberBall key={n} n={n} size={ballSize} mr={0.5} />
            ))}
          </Stack>
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
          <Typography variant="subtitle2" gutterBottom>
            등수 집계
          </Typography>
          <Typography>
            1등 {counts['1등'] || 0}회 · 2등 {counts['2등'] || 0}회 · 3등 {counts['3등'] || 0}회 · 4등{' '}
            {counts['4등'] || 0}회 · 5등 {counts['5등'] || 0}회
          </Typography>
        </CardContent>
      </Card>

      <Divider />

      <Stack spacing={1}>
        {results.slice(0, 50).map((r: any) => (
          <Card key={r.round} variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Typography fontWeight={700}>
                  {r.round}회 {r.rank}
                </Typography>
                <Stack direction="row" alignItems="center" sx={{ flexWrap: 'nowrap', whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  {r.win.map((n: number) => (
                    <NumberBall key={n} n={n} size={ballSize} mr={0.5} />
                  ))}
                  <Typography sx={{ mx: 0.75 }}>+</Typography>
                  <NumberBall n={r.bonus} size={ballSize} mr={0} />
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>
                일치: {r.matches.join(', ') || '없음'}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* 당첨 여부 확인 다이얼로그 */}
      <Dialog open={winCheckDialogOpen} onClose={() => setWinCheckDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>당첨 여부 확인</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {checkError && <Alert severity="error" sx={{ mb: 2 }}>{checkError}</Alert>}

          {!checkResult && (
            <>
              <TextField
                fullWidth
                label="회차 번호"
                type="number"
                value={roundInput}
                onChange={(e) => setRoundInput(e.target.value)}
                placeholder="예: 1150"
              />
            </>
          )}

          {checkResult && (
            <Stack spacing={1.5}>
              <Alert
                severity={checkResult.winStatus === 'win' ? 'success' : 'info'}
                icon={checkResult.winStatus === 'win' ? <CheckCircleIcon /> : <CancelIcon />}
              >
                {checkResult.winStatus === 'win' ? '당첨!' : '낙첨'}
              </Alert>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>일치 번호:</strong> {checkResult.matchedCount}개
                  </Typography>
                  {checkResult.bonusMatched && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>보너스:</strong> 일치 ✓
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    <strong>예측 번호:</strong> {checkResult.predNumbers.join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>당첨 번호:</strong> {checkResult.winNumbers.join(', ')} + {checkResult.bonusNumber}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {checkResult && (
            <Button onClick={() => setCheckResult(null)}>다시 확인</Button>
          )}
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
