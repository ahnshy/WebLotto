'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled, useTheme } from '@mui/material/styles';
import NumberBall from './NumberBall';
import type { LottoRow } from '@/app/actions';

const PAGE_SIZE = 50;
const BALL_SIZE = 24;
const FEATURED_BALL_SIZE = 68;
const RECENT_DRAW_WINDOW_DAYS = 7;

const NoWrapCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

function isRecentDraw(drawDate: string) {
  const [year, month, day] = drawDate.split('-').map(Number);
  if (!year || !month || !day) {
    return false;
  }

  const drawTime = new Date(year, month - 1, day).getTime();
  if (Number.isNaN(drawTime)) {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = today - drawTime;

  return diff >= 0 && diff <= RECENT_DRAW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function formatPrizeAmount(amount?: number | null) {
  if (amount == null) {
    return '-';
  }

  return `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
}

function formatPrizeAmountCompact(amount?: number | null) {
  if (amount == null) {
    return '-';
  }

  const uk = 100000000;
  if (amount >= uk) {
    const eok = Math.floor(amount / uk);
    const man = Math.floor((amount % uk) / 10000);
    return man > 0 ? `${eok}억 ${new Intl.NumberFormat('ko-KR').format(man)}만 원` : `${eok}억 원`;
  }

  return formatPrizeAmount(amount);
}

function formatWinnerCount(count?: number | null) {
  if (count == null) {
    return '-';
  }

  return `${new Intl.NumberFormat('ko-KR').format(count)}명`;
}

function RowCard({ row }: { row: LottoRow }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {row.round}회
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {row.draw_date}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {[row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].map((n, index) => (
            <NumberBall key={`${row.round}-${n}-${index}`} n={n} size={BALL_SIZE} mr={0} />
          ))}
          <Typography sx={{ mx: 0.25, opacity: 0.7 }}>+</Typography>
          <NumberBall n={row.bonus} size={BALL_SIZE} mr={0} />
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 2 }}
          justifyContent="space-between"
        >
          <Typography variant="body2">1등 당첨자수 {formatWinnerCount(row.first_prize_winners)}</Typography>
          <Typography variant="body2">1등 당첨금 {formatPrizeAmountCompact(row.first_prize_amount)}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function WinningsTable({ rows }: { rows: LottoRow[] }) {
  const theme = useTheme();
  const isResponsiveCard = useMediaQuery(theme.breakpoints.down('lg'));

  const [page, setPage] = React.useState(1);
  const [startInput, setStartInput] = React.useState('');
  const [endInput, setEndInput] = React.useState('');
  const [filter, setFilter] = React.useState<{ start: number; end: number } | null>(null);

  const sorted = React.useMemo(() => [...rows].sort((a, b) => b.round - a.round), [rows]);
  const latestRow = sorted[0] ?? null;
  const showRecentWinner = latestRow ? isRecentDraw(latestRow.draw_date) : false;

  const filtered = React.useMemo(() => {
    if (!filter) {
      return sorted;
    }
    return sorted.filter((row) => row.round >= filter.start && row.round <= filter.end);
  }, [filter, sorted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = React.useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, page]);

  const handleSearch = () => {
    const start = parseInt(startInput, 10);
    const end = parseInt(endInput, 10);

    if (!startInput && !endInput) {
      setFilter(null);
    } else if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end) {
      setFilter({ start, end });
    } else if (!Number.isNaN(start) && !endInput) {
      setFilter({ start, end: Number.MAX_SAFE_INTEGER });
    } else if (!startInput && !Number.isNaN(end)) {
      setFilter({ start: 1, end });
    }

    setPage(1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setStartInput('');
    setEndInput('');
    setFilter(null);
    setPage(1);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5} sx={{ mb: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', flex: 1 }}>
              <TextField
                size="small"
                label="시작 회차"
                value={startInput}
                onChange={(event) => setStartInput(event.target.value)}
                onKeyDown={handleKeyDown}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                sx={{ width: 110 }}
              />
              <Typography variant="body2" sx={{ opacity: 0.6 }}>~</Typography>
              <TextField
                size="small"
                label="종료 회차"
                value={endInput}
                onChange={(event) => setEndInput(event.target.value)}
                onKeyDown={handleKeyDown}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                sx={{ width: 110 }}
              />
              <Button variant="contained" size="small" onClick={handleSearch} startIcon={<SearchIcon />} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                검색
              </Button>
              {filter && (
                <Button size="small" onClick={handleReset} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  초기화
                </Button>
              )}
            </Stack>
          </Stack>

          {showRecentWinner && latestRow && (
            <Box
              sx={{
                borderRadius: 3,
                px: { xs: 2, sm: 3 },
                py: { xs: 2.5, sm: 3 },
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                border: '1px solid #7dd3fc',
                boxShadow: '0 14px 30px rgba(14, 165, 233, 0.14)',
              }}
            >
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#075985', textAlign: 'center' }}>
                  이번주 당첨번호
                </Typography>
                <Stack direction="row" spacing={1.25} justifyContent="center" alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  {[latestRow.n1, latestRow.n2, latestRow.n3, latestRow.n4, latestRow.n5, latestRow.n6].map((n) => (
                    <NumberBall key={`featured-${n}`} n={n} size={FEATURED_BALL_SIZE} mr={0} />
                  ))}
                  <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#0369a1', px: 0.5 }}>+</Typography>
                  <NumberBall n={latestRow.bonus} size={FEATURED_BALL_SIZE} mr={0} />
                </Stack>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={{ xs: 0.5, md: 2 }}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ color: '#0c4a6e' }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{latestRow.round}회차</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>추첨일 {latestRow.draw_date}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>1등 당첨자수 {formatWinnerCount(latestRow.first_prize_winners)}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>1등 당첨금 {formatPrizeAmount(latestRow.first_prize_amount)}</Typography>
                </Stack>
              </Stack>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
            <Chip size="small" label={`총 ${filtered.length.toLocaleString()}회차`} variant="outlined" />
            <Chip size="small" label={`${page} / ${totalPages} 페이지`} variant="outlined" />
          </Stack>
        </Stack>

        {isResponsiveCard ? (
          <Stack spacing={1.25}>
            {pageRows.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>해당 회차 데이터가 없습니다.</Box>
            ) : (
              pageRows.map((row) => <RowCard key={row.round} row={row} />)
            )}
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader aria-label="winning numbers table" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontSize: 13 } }}>
                  <NoWrapCell sx={{ width: '10%' }}>회차</NoWrapCell>
                  <NoWrapCell sx={{ width: '13%' }}>추첨일</NoWrapCell>
                  <TableCell sx={{ width: '37%', whiteSpace: 'nowrap' }}>당첨번호 + 보너스</TableCell>
                  <NoWrapCell sx={{ width: '14%', textAlign: 'center' }}>1등 당첨자수</NoWrapCell>
                  <TableCell sx={{ width: '26%', whiteSpace: 'nowrap', textAlign: 'right' }}>1등 당첨금</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, opacity: 0.5 }}>
                      해당 회차 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.round} hover>
                      <NoWrapCell>{row.round}회</NoWrapCell>
                      <NoWrapCell>{row.draw_date}</NoWrapCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'nowrap' }}>
                          {[row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].map((n, index) => (
                            <NumberBall key={`${row.round}-${n}-${index}`} n={n} size={BALL_SIZE} />
                          ))}
                          <Typography sx={{ mx: 0.25, opacity: 0.7 }}>+</Typography>
                          <NumberBall n={row.bonus} size={BALL_SIZE} />
                        </Stack>
                      </TableCell>
                      <NoWrapCell sx={{ textAlign: 'center' }}>{formatWinnerCount(row.first_prize_winners)}</NoWrapCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {formatPrizeAmountCompact(row.first_prize_amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
