'use client';

import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import PolylineIcon from '@mui/icons-material/Polyline';
import {useLocale} from 'next-intl';
import NumberBall from './NumberBall';
import type {LottoRow} from '@/app/actions';

type PatternResult = {
  numbers: number[];
  expectedOdd: number;
  expectedLowMidHigh: [number, number, number];
  expectedSum: number;
  expectedConsecutivePairs: number;
  topCandidates: Array<{number: number; score: number}>;
  recentAnchorRounds: number[];
};

function getMainNumbers(row: LottoRow) {
  return [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].sort((a, b) => a - b);
}

function normalize(values: number[]) {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  if (max === min) return values.map(() => 0);
  return values.map((value) => (value - min) / (max - min));
}

function weightedPick(scored: Array<{number: number; score: number}>, count: number) {
  const pool = scored.map((item) => ({...item}));
  const selected: number[] = [];

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(item.score, 0.001), 0);
    let point = Math.random() * total;
    let pickedIndex = pool.length - 1;

    for (let i = 0; i < pool.length; i += 1) {
      point -= Math.max(pool[i].score, 0.001);
      if (point <= 0) {
        pickedIndex = i;
        break;
      }
    }

    const [picked] = pool.splice(pickedIndex, 1);
    selected.push(picked.number);
  }

  return selected.sort((a, b) => a - b);
}

function countOdd(numbers: number[]) {
  return numbers.filter((number) => number % 2 === 1).length;
}

function countLowMidHigh(numbers: number[]): [number, number, number] {
  return numbers.reduce<[number, number, number]>(
    (acc, number) => {
      if (number <= 15) acc[0] += 1;
      else if (number <= 30) acc[1] += 1;
      else acc[2] += 1;
      return acc;
    },
    [0, 0, 0],
  );
}

function countConsecutivePairs(numbers: number[]) {
  let count = 0;
  for (let i = 1; i < numbers.length; i += 1) {
    if (numbers[i] - numbers[i - 1] === 1) count += 1;
  }
  return count;
}

function buildPatternPick(history: LottoRow[]): PatternResult {
  const ordered = [...history].sort((a, b) => a.round - b.round);
  const recent = ordered.slice(-24);
  const medium = ordered.slice(-60);
  const long = ordered.slice(-160);

  const recentFreq = Array.from({length: 45}, () => 0);
  const mediumFreq = Array.from({length: 45}, () => 0);
  const longFreq = Array.from({length: 45}, () => 0);
  const rowBias = Array.from({length: 9}, () => 0);
  const colBias = Array.from({length: 5}, () => 0);
  const lastDigitBias = Array.from({length: 10}, () => 0);
  const gapBias = Array.from({length: 45}, () => 0);

  recent.forEach((row, index) => {
    const weight = 1 + index / Math.max(recent.length, 1);
    const numbers = getMainNumbers(row);
    numbers.forEach((number, innerIndex) => {
      recentFreq[number - 1] += weight * 1.35;
      rowBias[Math.floor((number - 1) / 5)] += weight;
      colBias[(number - 1) % 5] += weight;
      lastDigitBias[number % 10] += weight * 0.7;
      if (innerIndex > 0) {
        const previous = numbers[innerIndex - 1];
        const gap = number - previous;
        gapBias[number - 1] += Math.max(0, 5 - gap) * 0.35;
      }
    });
  });

  medium.forEach((row, index) => {
    const weight = 0.8 + index / Math.max(medium.length, 1);
    getMainNumbers(row).forEach((number) => {
      mediumFreq[number - 1] += weight;
    });
  });

  long.forEach((row) => {
    getMainNumbers(row).forEach((number) => {
      longFreq[number - 1] += 1;
    });
  });

  const recentNorm = normalize(recentFreq);
  const mediumNorm = normalize(mediumFreq);
  const longNorm = normalize(longFreq);
  const rowNorm = normalize(rowBias);
  const colNorm = normalize(colBias);
  const digitNorm = normalize(lastDigitBias);
  const gapNorm = normalize(gapBias);

  const recentOddAverage = recent.reduce((sum, row) => sum + countOdd(getMainNumbers(row)), 0) / Math.max(recent.length, 1);
  const recentLowMidHigh = recent.reduce<[number, number, number]>(
    (acc, row) => {
      const [low, mid, high] = countLowMidHigh(getMainNumbers(row));
      return [acc[0] + low, acc[1] + mid, acc[2] + high];
    },
    [0, 0, 0],
  );
  const recentAverageSum = recent.reduce((sum, row) => sum + getMainNumbers(row).reduce((acc, number) => acc + number, 0), 0) / Math.max(recent.length, 1);
  const recentConsecutiveAverage = recent.reduce((sum, row) => sum + countConsecutivePairs(getMainNumbers(row)), 0) / Math.max(recent.length, 1);

  const expectedOdd = Math.min(5, Math.max(1, Math.round(recentOddAverage)));
  const expectedLowMidHigh = recentLowMidHigh.map((count) => Math.max(1, Math.round((count / Math.max(recent.length * 6, 1)) * 6))) as [number, number, number];

  while (expectedLowMidHigh[0] + expectedLowMidHigh[1] + expectedLowMidHigh[2] > 6) {
    const maxIndex = expectedLowMidHigh.indexOf(Math.max(...expectedLowMidHigh)) as 0 | 1 | 2;
    if (expectedLowMidHigh[maxIndex] > 1) expectedLowMidHigh[maxIndex] -= 1;
    else break;
  }
  while (expectedLowMidHigh[0] + expectedLowMidHigh[1] + expectedLowMidHigh[2] < 6) {
    const minIndex = expectedLowMidHigh.indexOf(Math.min(...expectedLowMidHigh)) as 0 | 1 | 2;
    expectedLowMidHigh[minIndex] += 1;
  }

  const targetSum = Math.round(recentAverageSum);
  const expectedConsecutivePairs = Math.min(3, Math.max(0, Math.round(recentConsecutiveAverage)));

  const scores = Array.from({length: 45}, (_, index) => {
    const number = index + 1;
    const rowIndex = Math.floor(index / 5);
    const colIndex = index % 5;
    const lastDigit = number % 10;

    let score = 0.08;
    score += recentNorm[index] * 1.9;
    score += mediumNorm[index] * 1.1;
    score += longNorm[index] * 0.45;
    score += rowNorm[rowIndex] * 0.9;
    score += colNorm[colIndex] * 0.8;
    score += digitNorm[lastDigit] * 0.55;
    score += gapNorm[index] * 0.4;

    if (number <= 10 || number >= 40) score += 0.08;
    if (number % 5 === 0 || number % 5 === 1) score += 0.06;

    return {number, score};
  }).sort((a, b) => b.score - a.score);

  const buckets = [
    scores.filter((item) => item.number <= 15),
    scores.filter((item) => item.number >= 16 && item.number <= 30),
    scores.filter((item) => item.number >= 31),
  ];

  const initial = [
    ...weightedPick(buckets[0], expectedLowMidHigh[0]),
    ...weightedPick(buckets[1], expectedLowMidHigh[1]),
    ...weightedPick(buckets[2], expectedLowMidHigh[2]),
  ];

  const deduped = Array.from(new Set(initial));
  for (const item of scores) {
    if (!deduped.includes(item.number)) deduped.push(item.number);
    if (deduped.length === 10) break;
  }

  let bestNumbers = deduped.slice(0, 6).sort((a, b) => a - b);
  let bestPenalty = Number.POSITIVE_INFINITY;

  const candidatePool = deduped.slice(0, 10);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const trial = weightedPick(
      candidatePool.map((number) => {
        const base = scores.find((item) => item.number === number)?.score ?? 0.1;
        return {number, score: base};
      }),
      6,
    );

    const oddPenalty = Math.abs(countOdd(trial) - expectedOdd) * 1.6;
    const [low, mid, high] = countLowMidHigh(trial);
    const rangePenalty = Math.abs(low - expectedLowMidHigh[0]) + Math.abs(mid - expectedLowMidHigh[1]) + Math.abs(high - expectedLowMidHigh[2]);
    const sumPenalty = Math.abs(trial.reduce((sum, number) => sum + number, 0) - targetSum) / 8.5;
    const consecutivePenalty = Math.abs(countConsecutivePairs(trial) - expectedConsecutivePairs) * 1.25;

    const penalty = oddPenalty + rangePenalty + sumPenalty + consecutivePenalty;
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestNumbers = trial;
    }
  }

  return {
    numbers: bestNumbers,
    expectedOdd,
    expectedLowMidHigh,
    expectedSum: targetSum,
    expectedConsecutivePairs,
    topCandidates: scores.slice(0, 12),
    recentAnchorRounds: recent.slice(-5).map((row) => row.round),
  };
}

export default function PatternBasedPanel({
  history,
  ballSize,
  onGenerated,
}: {
  history: LottoRow[];
  ballSize: number;
  onGenerated: (numbers: number[]) => Promise<void>;
}) {
  const isEn = useLocale() === 'en';
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<PatternResult | null>(null);

  const handleGenerate = async () => {
    if (history.length < 20) {
      setError(isEn ? 'Pattern-based draw requires at least 20 rounds of winning history.' : '패턴기반 추출은 최소 20회차 이상의 당첨 이력이 필요합니다.');
      return;
    }

    setRunning(true);
    setError('');

    try {
      const next = buildPatternPick(history);
      await onGenerated(next.numbers);
      setResult(next);
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
          <Stack spacing={1.5}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} spacing={1}>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{fontWeight: 700}}>
                  {isEn ? 'Pattern-based Draw' : '패턴기반 추출'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isEn ? 'Analyzes recent winning patterns such as odd-even balance, range distribution, and number placement to build this week’s pick.' : '최근 당첨 패턴의 홀짝, 구간 분포, 번호 배치 흐름을 분석해 금주 예상 패턴에 맞는 번호를 추출합니다.'}
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={<PolylineIcon />}
                onClick={handleGenerate}
                disabled={running}
                sx={{alignSelf: {xs: 'stretch', sm: 'auto'}}}
              >
                {running ? (isEn ? 'Analyzing pattern...' : '패턴 분석 중...') : (isEn ? 'Pattern-based Draw' : '패턴기반 추출')}
              </Button>
            </Stack>

            <Alert severity="info">
              {isEn ? 'Combines recent pattern-board flow with cumulative winning patterns to assemble numbers that match the expected pattern this week.' : '최근 패턴 보드 흐름과 누적 당첨 패턴을 합쳐 이번 주 예상 패턴을 만들고 그 패턴에 맞게 번호를 조합합니다.'}
            </Alert>

            {error && <Alert severity="error">{error}</Alert>}

            {result && (
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{fontWeight: 700}}>
                  {isEn ? 'Generated Numbers' : '추출 번호'}
                </Typography>
                <Stack direction="row" sx={{flexWrap: 'wrap', gap: 0.5}}>
                  {result.numbers.map((n) => (
                    <NumberBall key={n} n={n} size={ballSize} mr={0} />
                  ))}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {isEn ? `Expected odd-even pattern: odd ${result.expectedOdd} / even ${6 - result.expectedOdd}` : `예상 홀짝 패턴: 홀수 ${result.expectedOdd} / 짝수 ${6 - result.expectedOdd}`}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {isEn ? `Expected range pattern: low ${result.expectedLowMidHigh[0]}, mid ${result.expectedLowMidHigh[1]}, high ${result.expectedLowMidHigh[2]}` : `예상 구간 패턴: 저구간 ${result.expectedLowMidHigh[0]}, 중구간 ${result.expectedLowMidHigh[1]}, 고구간 ${result.expectedLowMidHigh[2]}`}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {isEn ? `Expected total sum: about ${result.expectedSum}, expected consecutive pairs ${result.expectedConsecutivePairs}` : `예상 번호합: 약 ${result.expectedSum}, 예상 연속번호 수 ${result.expectedConsecutivePairs}`}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {isEn ? 'Top candidates' : '상위 후보'}: {result.topCandidates.map((item) => `${item.number}(${item.score.toFixed(2)})`).join(', ')}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {isEn ? `Anchor rounds: recent pattern anchors ${result.recentAnchorRounds.join(', ')}` : `기준 회차: 최근 패턴 앵커 ${result.recentAnchorRounds.join(', ')}회차`}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
