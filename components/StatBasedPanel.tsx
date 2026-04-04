'use client';

import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import NumberBall from './NumberBall';
import type { LottoRow } from '@/app/actions';

export type StatOption =
  | 'hot_frequency'
  | 'cold_missing'
  | 'range_ratio'
  | 'monthly_hot'
  | 'hot_focus'
  | 'cold_focus';

export const STAT_OPTION_LABELS: Record<StatOption, { title: string; description: string }> = {
  hot_frequency: {
    title: '빈출 번호',
    description: '전체 누적 당첨 이력에서 자주 나온 번호 가중치 반영',
  },
  cold_missing: {
    title: '미출현 번호',
    description: '최근 오래 나오지 않은 번호 가중치 반영',
  },
  range_ratio: {
    title: '번호대 비율',
    description: '1-15 / 16-30 / 31-45 구간 비율을 최근 통계에 맞춰 반영',
  },
  monthly_hot: {
    title: '월별 다수출현',
    description: '현재 월에 강세였던 번호 빈도를 반영',
  },
  hot_focus: {
    title: '다수출현 위주',
    description: '상위 빈출 번호 그룹을 더 강하게 우선',
  },
  cold_focus: {
    title: '비출현 번호 기반',
    description: '장기 미출현 번호 그룹을 더 강하게 우선',
  },
};

const DEFAULT_OPTIONS: StatOption[] = ['hot_frequency', 'range_ratio'];

function getMainNumbers(row: LottoRow): number[] {
  return [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6];
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  if (max === min) return values.map(() => 0);
  return values.map((value) => (value - min) / (max - min));
}

function weightedPick(scored: Array<{ number: number; score: number }>, count: number) {
  const pool = scored.map((item) => ({ ...item }));
  const selected: number[] = [];

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(item.score, 0.001), 0);
    let point = Math.random() * total;
    let pickedIndex = 0;

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

function buildStatistics(history: LottoRow[]) {
  const ordered = [...history].sort((a, b) => a.round - b.round);
  const latest = ordered[ordered.length - 1];
  const currentMonth = latest ? new Date(latest.draw_date).getMonth() + 1 : new Date().getMonth() + 1;
  const frequency = Array.from({ length: 45 }, () => 0);
  const monthlyFrequency = Array.from({ length: 45 }, () => 0);
  const lastSeen = Array.from({ length: 45 }, () => -1);
  const rangeCounts = [0, 0, 0];

  ordered.forEach((row, index) => {
    const numbers = getMainNumbers(row);
    const month = new Date(row.draw_date).getMonth() + 1;

    for (const number of numbers) {
      frequency[number - 1] += 1;
      lastSeen[number - 1] = index;
      if (month === currentMonth) monthlyFrequency[number - 1] += 1;
      if (number <= 15) rangeCounts[0] += 1;
      else if (number <= 30) rangeCounts[1] += 1;
      else rangeCounts[2] += 1;
    }
  });

  const latestIndex = ordered.length - 1;
  const missingGap = lastSeen.map((seenIndex) => (seenIndex === -1 ? ordered.length : latestIndex - seenIndex));
  const normalizedFrequency = normalize(frequency);
  const normalizedMissing = normalize(missingGap);
  const normalizedMonthly = normalize(monthlyFrequency);

  const totalNumbers = Math.max(ordered.length * 6, 1);
  const rangeRatio = rangeCounts.map((count) => count / totalNumbers);
  const rangeTargets = [
    Math.max(1, Math.round(rangeRatio[0] * 6)),
    Math.max(1, Math.round(rangeRatio[1] * 6)),
    Math.max(1, Math.round(rangeRatio[2] * 6)),
  ];

  while (rangeTargets.reduce((sum, count) => sum + count, 0) > 6) {
    const maxIndex = rangeTargets.indexOf(Math.max(...rangeTargets));
    if (rangeTargets[maxIndex] > 1) rangeTargets[maxIndex] -= 1;
    else break;
  }
  while (rangeTargets.reduce((sum, count) => sum + count, 0) < 6) {
    const minIndex = rangeTargets.indexOf(Math.min(...rangeTargets));
    rangeTargets[minIndex] += 1;
  }

  return {
    normalizedFrequency,
    normalizedMissing,
    normalizedMonthly,
    rangeTargets,
    currentMonth,
    rounds: ordered.length,
  };
}

function buildPick(history: LottoRow[], options: StatOption[]) {
  const stats = buildStatistics(history);
  const scores = Array.from({ length: 45 }, (_, index) => {
    const number = index + 1;
    let score = 0.1;

    if (options.includes('hot_frequency')) score += stats.normalizedFrequency[index] * 1.2;
    if (options.includes('cold_missing')) score += stats.normalizedMissing[index] * 1.1;
    if (options.includes('monthly_hot')) score += stats.normalizedMonthly[index] * 1.15;
    if (options.includes('hot_focus')) score += stats.normalizedFrequency[index] * 1.8;
    if (options.includes('cold_focus')) score += stats.normalizedMissing[index] * 1.8;

    return { number, score };
  }).sort((a, b) => b.score - a.score);

  let picked = weightedPick(scores, 6);

  if (options.includes('range_ratio')) {
    const buckets = [
      scores.filter((item) => item.number <= 15),
      scores.filter((item) => item.number >= 16 && item.number <= 30),
      scores.filter((item) => item.number >= 31),
    ];

    const adjusted: number[] = [];
    stats.rangeTargets.forEach((targetCount, bucketIndex) => {
      const bucketPick = weightedPick(buckets[bucketIndex], targetCount);
      adjusted.push(...bucketPick);
    });

    const deduped = Array.from(new Set(adjusted));
    if (deduped.length < 6) {
      for (const item of scores) {
        if (!deduped.includes(item.number)) deduped.push(item.number);
        if (deduped.length === 6) break;
      }
    }
    picked = deduped.slice(0, 6).sort((a, b) => a - b);
  }

  return {
    numbers: picked,
    topCandidates: scores.slice(0, 12),
    stats,
  };
}

export default function StatBasedPanel({
  history,
  ballSize,
  onGenerated,
}: {
  history: LottoRow[];
  ballSize: number;
  onGenerated: (numbers: number[], options: StatOption[]) => Promise<void>;
}) {
  const [selectedOptions, setSelectedOptions] = React.useState<StatOption[]>(DEFAULT_OPTIONS);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<ReturnType<typeof buildPick> | null>(null);

  const toggleOption = (option: StatOption) => {
    setSelectedOptions((prev) => (
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    ));
  };

  const handleGenerate = async () => {
    if (selectedOptions.length === 0) {
      setError('통계 기준을 1개 이상 선택해 주세요.');
      return;
    }

    setRunning(true);
    setError('');

    try {
      const next = buildPick(history, selectedOptions);
      await onGenerated(next.numbers, selectedOptions);
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
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  통계기반 추출
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  누적 당첨 통계와 월별/빈도/미출현 패턴을 조합해 번호를 추출합니다.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={<TuneIcon />}
                onClick={handleGenerate}
                disabled={running}
                sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                {running ? '추출 중...' : '통계기반 추출'}
              </Button>
            </Stack>

            <Alert severity="info">
              하나 이상 선택할 수 있고, 여러 통계 기준을 함께 조합해서 번호를 생성합니다.
            </Alert>

            <FormGroup>
              {Object.entries(STAT_OPTION_LABELS).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={(
                    <Checkbox
                      checked={selectedOptions.includes(key as StatOption)}
                      onChange={() => toggleOption(key as StatOption)}
                    />
                  )}
                  label={(
                    <Stack spacing={0.1}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{value.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{value.description}</Typography>
                    </Stack>
                  )}
                />
              ))}
            </FormGroup>

            {error && <Alert severity="error">{error}</Alert>}

            {result && (
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  추출 번호
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {result.numbers.map((n) => (
                    <NumberBall key={n} n={n} size={ballSize} mr={0} />
                  ))}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  선택 기준: {selectedOptions.map((item) => STAT_OPTION_LABELS[item].title).join(', ')}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  상위 후보: {result.topCandidates.map((item) => `${item.number}(${item.score.toFixed(2)})`).join(', ')}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {`${result.stats.rounds.toLocaleString()}회차 누적 통계 사용, ${result.stats.currentMonth}월 강세 패턴 반영`}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
