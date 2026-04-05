'use client';
import * as React from 'react';
import { Card, CardContent, Grid, Typography, Box, Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { LottoRow } from '@/app/actions';

// 1~45를 7열 기준 로또 용지형으로 배치
function posOf(n: number) {
  return { col: (n - 1) % 7, row: Math.floor((n - 1) / 7) };
}

function Board({ row }: { row: LottoRow }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.15)';
  const gridText = isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)';

  const VW = 276;
  const VH = 226;
  const padX = 24;
  const padY = 24;
  const cols = 7;
  const rows = 7;
  const cellW = (VW - 2 * padX) / (cols - 1);
  const cellH = (VH - 2 * padY) / (rows - 1);
  const nums = [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6];
  const pts = nums.map((n) => {
    const p = posOf(n);
    return [padX + p.col * cellW, padY + p.row * cellH];
  });

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: 1.5,
        bgcolor: 'background.paper',
        boxShadow: (t) => t.shadows[1],
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        {row.round}회차{' '}
        <Typography component="span" variant="caption" sx={{ opacity: 0.55, fontWeight: 400 }}>
          {row.draw_date}
        </Typography>
      </Typography>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        aria-label={`${row.round}회차 패턴`}
      >
        {Array.from({ length: 45 }, (_, i) => {
          const n = i + 1;
          const p = posOf(n);
          const x = padX + p.col * cellW;
          const y = padY + p.row * cellH;
          return (
            <g key={n}>
              <rect x={x - 12} y={y - 12} width="24" height="24" rx="4" ry="4" fill="none" stroke={gridStroke} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fill={gridText}>
                {n}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#6bd6ff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.map((p) => p.join(',')).join(' ')}
        />

        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="11.5" fill="#69c8f2" />
            <text x={p[0]} y={p[1] + 4} fontSize="12" textAnchor="middle" fill="#fff" fontWeight="800">
              {nums[i]}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

const PAGE_STEP = 12;

export default function PatternBoards({ rows }: { rows: LottoRow[] }) {
  const [count, setCount] = React.useState(PAGE_STEP);

  const sorted = React.useMemo(
    () => [...rows].sort((a, b) => b.round - a.round),
    [rows]
  );

  const view = sorted.slice(0, count);
  const hasMore = count < sorted.length;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2">
            당첨 패턴 (최신순)
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.55 }}>
            {view.length} / {sorted.length}회차
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          {view.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.round}>
              <Board row={r} />
            </Grid>
          ))}
        </Grid>

        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCount((c) => Math.min(sorted.length, c + PAGE_STEP))}
            >
              더 보기 ({Math.min(PAGE_STEP, sorted.length - count)}개)
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
