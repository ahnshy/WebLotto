'use client';
import * as React from 'react';
import {
  Card, CardContent, Stack, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Pagination, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import NumberBall from './NumberBall';
import type { LottoRow } from '@/app/actions';

const PAGE_SIZE = 100;

const NoWrapCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 120
});

export default function WinningsTable({ rows }: { rows: LottoRow[] }) {
  const [page, setPage] = React.useState(1);
  const [startInput, setStartInput] = React.useState('');
  const [endInput, setEndInput] = React.useState('');
  const [filter, setFilter] = React.useState<{ start: number; end: number } | null>(null);

  // 기본: 내림차순 정렬
  const sorted = React.useMemo(() => {
    return [...rows].sort((a, b) => b.round - a.round);
  }, [rows]);

  // 필터 적용
  const filtered = React.useMemo(() => {
    if (!filter) return sorted;
    return sorted.filter(r => r.round >= filter.start && r.round <= filter.end);
  }, [sorted, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // 현재 페이지 데이터
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleSearch = () => {
    const s = parseInt(startInput, 10);
    const e = parseInt(endInput, 10);
    if (!startInput && !endInput) {
      setFilter(null);
    } else if (!isNaN(s) && !isNaN(e) && s <= e) {
      setFilter({ start: s, end: e });
    } else if (!isNaN(s) && !endInput) {
      setFilter({ start: s, end: 99999 });
    } else if (!startInput && !isNaN(e)) {
      setFilter({ start: 1, end: e });
    }
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
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
        {/* 검색 영역 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <TextField
              size="small"
              label="시작 회차"
              value={startInput}
              onChange={e => setStartInput(e.target.value)}
              onKeyDown={handleKeyDown}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ width: 110 }}
            />
            <Typography variant="body2" sx={{ opacity: 0.6 }}>~</Typography>
            <TextField
              size="small"
              label="종료 회차"
              value={endInput}
              onChange={e => setEndInput(e.target.value)}
              onKeyDown={handleKeyDown}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ width: 110 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              검색
            </Button>
            {filter && (
              <Button size="small" onClick={handleReset} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                초기화
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={`총 ${filtered.length.toLocaleString()}회차`}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`${page} / ${totalPages} 페이지`}
              variant="outlined"
            />
          </Stack>
        </Stack>

        {/* 테이블 */}
        <TableContainer>
          <Table size="small" stickyHeader aria-label="winning numbers table">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { fontSize: { xs: 12, sm: 13 } } }}>
                <NoWrapCell sx={{ width: 80 }}>회차</NoWrapCell>
                <NoWrapCell sx={{ width: 110 }}>추첨일</NoWrapCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>당첨번호 + 보너스</TableCell>
                <NoWrapCell sx={{ width: 90, textAlign: 'center', display: { xs: 'none', sm: 'table-cell' } }}>1등 당첨자수</NoWrapCell>
                <NoWrapCell sx={{ width: 120, textAlign: 'right', display: { xs: 'none', sm: 'table-cell' } }}>1등 당첨금액</NoWrapCell>
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
                pageRows.map(r => (
                  <TableRow key={r.round} hover>
                    <NoWrapCell>{r.round}회</NoWrapCell>
                    <NoWrapCell>{r.draw_date}</NoWrapCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap' }}>
                        {[r.n1, r.n2, r.n3, r.n4, r.n5, r.n6].map(n => (<NumberBall key={n} n={n} size={24} />))}
                        <Typography sx={{ mx: .5, opacity: .7 }}> + </Typography>
                        <NumberBall n={r.bonus} size={24} />
                      </Stack>
                    </TableCell>
                    <NoWrapCell sx={{ textAlign: 'center', display: { xs: 'none', sm: 'table-cell' } }}>{r.first_prize_winners ?? '-'}</NoWrapCell>
                    <NoWrapCell sx={{ textAlign: 'right', display: { xs: 'none', sm: 'table-cell' } }}>{r.first_prize_amount ?? '-'}</NoWrapCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
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
