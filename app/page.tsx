'use client';
import * as React from 'react';
import {
  Grid, Paper, Stack, Typography, Button, Divider,
  useMediaQuery, Backdrop, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import dynamic from 'next/dynamic';
import { fetchDraws, saveDraw, fetchLottoHistoryAll, deleteDraws, LottoRow, DrawRow } from './actions';
import { useNav } from '@/components/NavContext';
import SyncPanel from '@/components/SyncPanel';
import AiLstmPanel from '@/components/AiLstmPanel';
import AiRandomForestPanel from '@/components/AiRandomForestPanel';
import StatBasedPanel, { STAT_OPTION_LABELS, StatOption } from '@/components/StatBasedPanel';
import PatternBasedPanel from '@/components/PatternBasedPanel';
import MockDrawPanel from '@/components/MockDrawPanel';
import DrawHistoryActions from '@/components/DrawHistoryActions';
import { printLottoSlip } from '@/components/lottoPrint';
import { useAuth } from '@/components/AuthContext';
import NumberBall from '@/components/NumberBall';

const DrawList = dynamic(() => import('@/components/DrawList'), { ssr: false });
const CompareView = dynamic(() => import('@/components/CompareView'), { ssr: false });
const PatternBoards = dynamic(() => import('@/components/PatternBoards'), {
  loading: () => (
    <Backdrop open sx={{ color: '#fff', zIndex: (t) => t.zIndex.modal + 1 }}>
      <CircularProgress />
    </Backdrop>
  ),
  ssr: false,
});
const WinningsTable = dynamic(() => import('@/components/WinningsTable'), {
  loading: () => (
    <Backdrop open sx={{ color: '#fff', zIndex: (t) => t.zIndex.modal + 1 }}>
      <CircularProgress />
    </Backdrop>
  ),
  ssr: false,
});

export default function Page() {
  const { user, email, loading: authLoading } = useAuth();
  const [draws, setDraws] = React.useState<DrawRow[]>([]);
  const [selected, setSelected] = React.useState<DrawRow | null>(null);
  const [history, setHistory] = React.useState<LottoRow[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [purchaseQueue, setPurchaseQueue] = React.useState<DrawRow[]>([]);
  const [loadingView, setLoadingView] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [aiModelInitializing, setAiModelInitializing] = React.useState(false);
  const { section } = useNav();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdOnly = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const ballSize = isXs ? 22 : isMdOnly ? 28 : 36;
  const isRandomSection = section === '난수 추출';
  const isStatSection = section === '통계기반 추출';
  const isPatternSection = section === '패턴기반 추출';
  const isAiSection = section === 'AI 딥러닝 추출';
  const isAiMlSection = section === 'AI 머신러닝 추출';
  const isSimulationSection = section === '모의추첨';
  const isExtractionSection = isRandomSection || isStatSection || isPatternSection || isAiSection || isAiMlSection;
  const loadingMessage = section === '당첨번호보기'
    ? '로딩 중입니다... 잠시 기다려 주십시요.'
    : '불러오는 중....';
  const queueStorageKey = React.useMemo(
    () => `purchase-queue:${user?.id ?? 'guest'}`,
    [user?.id]
  );

  React.useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const [d, initialHistory] = await Promise.all([
          fetchDraws(user?.id ?? null),
          fetchLottoHistoryAll(30),
        ]);

        if (cancelled) return;

        setDraws(d || []);
        if (d && d.length) setSelected(d[0]);
        setHistory(initialHistory || []);
        setHistoryLoading(false);

        fetchLottoHistoryAll()
          .then((allHistory) => {
            if (cancelled) return;
            setHistory(allHistory || []);
          })
          .catch((error) => {
            console.error('Failed to fetch full lotto history:', error);
          });
      } catch (e) {
        console.error('Failed to fetch data:', e);
        if (cancelled) return;
        setDraws([]);
        setHistory([]);
        setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(queueStorageKey);
      if (!raw) {
        setPurchaseQueue([]);
        return;
      }
      const parsed = JSON.parse(raw) as DrawRow[];
      setPurchaseQueue(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPurchaseQueue([]);
    }
  }, [queueStorageKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(queueStorageKey, JSON.stringify(purchaseQueue));
  }, [purchaseQueue, queueStorageKey]);

  React.useEffect(() => {
    if (section === '당첨 패턴 분석') {
      setLoadingView(true);
      const t = setTimeout(() => setLoadingView(false), 300);
      return () => clearTimeout(t);
    }
    setLoadingView(false);
  }, [section]);

  const generate = () => {
    const s = new Set<number>();
    while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45));
    return Array.from(s).sort((a, b) => a - b);
  };

  const onGenerate = async () => {
    const g = generate();
    const row = await saveDraw(g, 'random', [], { id: user?.id ?? null, email });
    setDraws((prev) => [row, ...prev]);
    setSelected(row);
  };

  const toggleCheck = (id: string) => setChecked((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const selectAll = () => setChecked(new Set(draws.map((d) => d.id)));
  const clearAll = () => setChecked(new Set());
  const checkedDraws = React.useMemo(
    () => draws.filter((draw) => checked.has(draw.id)),
    [draws, checked]
  );
  const actionTargetDraws = checkedDraws.length > 0 ? checkedDraws : (selected ? [selected] : []);

  const formatDrawsForClipboard = React.useCallback((rows: DrawRow[]) => {
    return rows
      .map((draw, index) => `${index + 1}. ${draw.numbers.join(', ')}`)
      .join('\n');
  }, []);

  const copyNumbers = React.useCallback(async (rows: DrawRow[]) => {
    if (rows.length === 0) {
      window.alert('복사할 번호를 선택해 주세요.');
      return;
    }
    const text = formatDrawsForClipboard(rows);
    await navigator.clipboard.writeText(text);
  }, [formatDrawsForClipboard]);

  const handlePrintSelected = () => {
    if (actionTargetDraws.length === 0) {
      window.alert('출력할 번호를 1개 이상 선택해 주세요.');
      return;
    }
    if (actionTargetDraws.length > 5) {
      window.alert('최대 5개 번호까지만 출력할 수 있습니다.');
      return;
    }
    printLottoSlip(actionTargetDraws);
  };

  const handleCopySelected = async () => {
    try {
      await copyNumbers(actionTargetDraws);
      window.alert('선택한 번호를 클립보드에 복사했습니다.');
    } catch (error) {
      window.alert(`번호 복사에 실패했습니다: ${String(error)}`);
    }
  };

  const handleOpenDhLottery = async () => {
    try {
      await copyNumbers(actionTargetDraws);
      window.open('https://www.dhlottery.co.kr/main', '_blank', 'noopener,noreferrer');
      window.alert('동행복권 사이트를 열고 선택한 번호를 클립보드에 복사했습니다.');
    } catch (error) {
      window.alert(`동행복권 열기에 실패했습니다: ${String(error)}`);
    }
  };

  const handleAddToPurchaseQueue = () => {
    if (actionTargetDraws.length === 0) {
      window.alert('구매 대기함에 담을 번호를 선택해 주세요.');
      return;
    }

    setPurchaseQueue((prev) => {
      const next = [...prev];
      for (const draw of actionTargetDraws) {
        if (!next.some((item) => item.id === draw.id)) {
          next.push(draw);
        }
      }
      return next.slice(0, 20);
    });
  };

  const removeFromPurchaseQueue = (id: string) => {
    setPurchaseQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearPurchaseQueue = () => {
    setPurchaseQueue([]);
  };

  const removeSelected = async () => {
    if (checked.size === 0) return;
    const ids = Array.from(checked);
    await deleteDraws(ids, user?.id ?? null);
    setDraws((prev) => prev.filter((d) => !checked.has(d.id)));
    if (selected && checked.has(selected.id)) setSelected(null);
    setChecked(new Set());
  };

  const removeOne = async (id: string) => {
    await deleteDraws([id], user?.id ?? null);
    setDraws((prev) => prev.filter((d) => d.id !== id));
    if (selected?.id === id) setSelected(null);
    setChecked((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  if (section === '동기화') {
    return (
      <Grid container spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, position: 'relative', minHeight: 200 }}>
            <SyncPanel />
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
      <Grid item xs={12} md sx={{ order: { xs: 1, md: 1 }, flexBasis: { xs: '100%', md: 580 }, flexGrow: 1, minWidth: 0 }}>
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', minHeight: 200 }}>
          {section === '당첨번호보기' && <WinningsTable rows={history} />}
          {section === '당첨 패턴 분석' && <PatternBoards rows={history} />}
          {isRandomSection && (
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>최근 추출</Typography>
                <Button startIcon={<AutoAwesomeIcon />} variant="contained" onClick={onGenerate} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                  새로 추출
                </Button>
              </Stack>

              <DrawHistoryActions
                onSelectAll={selectAll}
                onClearAll={clearAll}
                onRemoveSelected={removeSelected}
                onPrintSelected={handlePrintSelected}
                onCopySelected={handleCopySelected}
                onOpenDhLottery={handleOpenDhLottery}
                onAddToPurchaseQueue={handleAddToPurchaseQueue}
              />

              <DrawList
                ballSize={ballSize}
                draws={draws}
                selectedId={selected?.id ?? null}
                onSelect={(r) => setSelected(r)}
                checkedIds={checked}
                onToggleCheck={toggleCheck}
                onDeleteOne={removeOne}
              />
            </Stack>
          )}

          {isStatSection && (
            <Stack spacing={1.5}>
              <StatBasedPanel
                history={history}
                ballSize={ballSize}
                onGenerated={async (numbers, options) => {
                  const row = await saveDraw(
                    numbers,
                    'stat',
                    options.map((option: StatOption) => STAT_OPTION_LABELS[option].title),
                    { id: user?.id ?? null, email }
                  );
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>통계 추출 이력</Typography>
              </Stack>

              <DrawHistoryActions
                onSelectAll={selectAll}
                onClearAll={clearAll}
                onRemoveSelected={removeSelected}
                onPrintSelected={handlePrintSelected}
                onCopySelected={handleCopySelected}
                onOpenDhLottery={handleOpenDhLottery}
                onAddToPurchaseQueue={handleAddToPurchaseQueue}
              />

              <DrawList
                ballSize={ballSize}
                draws={draws}
                selectedId={selected?.id ?? null}
                onSelect={(r) => setSelected(r)}
                checkedIds={checked}
                onToggleCheck={toggleCheck}
                onDeleteOne={removeOne}
              />
            </Stack>
          )}

          {isPatternSection && (
            <Stack spacing={1.5}>
              <PatternBasedPanel
                history={history}
                ballSize={ballSize}
                onGenerated={async (numbers) => {
                  const row = await saveDraw(numbers, 'pattern', [], { id: user?.id ?? null, email });
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>패턴 추출 이력</Typography>
              </Stack>

              <DrawHistoryActions
                onSelectAll={selectAll}
                onClearAll={clearAll}
                onRemoveSelected={removeSelected}
                onPrintSelected={handlePrintSelected}
                onCopySelected={handleCopySelected}
                onOpenDhLottery={handleOpenDhLottery}
                onAddToPurchaseQueue={handleAddToPurchaseQueue}
              />

              <DrawList
                ballSize={ballSize}
                draws={draws}
                selectedId={selected?.id ?? null}
                onSelect={(r) => setSelected(r)}
                checkedIds={checked}
                onToggleCheck={toggleCheck}
                onDeleteOne={removeOne}
              />
            </Stack>
          )}

          {isAiSection && (
            <Stack spacing={1.5}>
              <AiLstmPanel
                ballSize={ballSize}
                onGenerated={(row) => {
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
                onWarmStateChange={setAiModelInitializing}
                ownerId={user?.id ?? null}
                ownerEmail={email}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>AI 추출 이력</Typography>
              </Stack>

              <DrawHistoryActions
                onSelectAll={selectAll}
                onClearAll={clearAll}
                onRemoveSelected={removeSelected}
                onPrintSelected={handlePrintSelected}
                onCopySelected={handleCopySelected}
                onOpenDhLottery={handleOpenDhLottery}
                onAddToPurchaseQueue={handleAddToPurchaseQueue}
              />

              <DrawList
                ballSize={ballSize}
                draws={draws}
                selectedId={selected?.id ?? null}
                onSelect={(r) => setSelected(r)}
                checkedIds={checked}
                onToggleCheck={toggleCheck}
                onDeleteOne={removeOne}
              />
            </Stack>
          )}

          {isAiMlSection && (
            <Stack spacing={1.5}>
              <AiRandomForestPanel
                ballSize={ballSize}
                onGenerated={(row) => {
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
                onWarmStateChange={setAiModelInitializing}
                ownerId={user?.id ?? null}
                ownerEmail={email}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>AI 추출 이력</Typography>
              </Stack>

              <DrawHistoryActions
                onSelectAll={selectAll}
                onClearAll={clearAll}
                onRemoveSelected={removeSelected}
                onPrintSelected={handlePrintSelected}
                onCopySelected={handleCopySelected}
                onOpenDhLottery={handleOpenDhLottery}
                onAddToPurchaseQueue={handleAddToPurchaseQueue}
              />

              <DrawList
                ballSize={ballSize}
                draws={draws}
                selectedId={selected?.id ?? null}
                onSelect={(r) => setSelected(r)}
                checkedIds={checked}
                onToggleCheck={toggleCheck}
                onDeleteOne={removeOne}
              />
            </Stack>
          )}

          {isSimulationSection && <MockDrawPanel />}

          <Backdrop
            open={
              loadingView ||
              (section === '당첨번호보기' && historyLoading) ||
              ((isAiSection || isAiMlSection) && aiModelInitializing)
            }
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: (t) => t.zIndex.modal + 1,
              color: 'text.primary',
              bgcolor: (t) => t.palette.mode === 'dark'
                ? 'rgba(10, 14, 24, 0.48)'
                : 'rgba(255, 255, 255, 0.62)',
              backdropFilter: 'blur(3px)',
            }}
          >
            <Stack spacing={1.5} alignItems="center">
              <CircularProgress color="primary" />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  textAlign: 'center',
                  textShadow: (t) => t.palette.mode === 'dark'
                    ? '0 1px 2px rgba(0,0,0,0.35)'
                    : 'none',
                }}
              >
                {(isAiSection || isAiMlSection) && aiModelInitializing
                  ? 'AI Model을 초기화 중입니다...'
                  : loadingMessage}
              </Typography>
            </Stack>
          </Backdrop>
        </Paper>
      </Grid>

      {isExtractionSection && (
        <Grid item xs={12} md sx={{ order: { xs: 2, md: 2 }, flexBasis: { xs: '100%', md: 420 }, flexGrow: 0, flexShrink: 0 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
              <CompareView ballSize={ballSize} pick={selected?.numbers ?? null} pickId={selected?.id ?? null} history={history} />
            </Paper>

            <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalMallOutlinedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      구매 대기함
                    </Typography>
                  </Stack>
                  <Button size="small" color="inherit" onClick={clearPurchaseQueue}>
                    비우기
                  </Button>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  선택한 번호를 임시로 보관하고, 복사하거나 동행복권 사이트를 열어 오프라인/수동 구매에 활용할 수 있습니다.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => void copyNumbers(purchaseQueue)}
                    disabled={purchaseQueue.length === 0}
                  >
                    대기함 복사
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={async () => {
                      try {
                        await copyNumbers(purchaseQueue);
                        window.open('https://www.dhlottery.co.kr/main', '_blank', 'noopener,noreferrer');
                      } catch (error) {
                        window.alert(`동행복권 열기에 실패했습니다: ${String(error)}`);
                      }
                    }}
                    disabled={purchaseQueue.length === 0}
                  >
                    사이트 열기
                  </Button>
                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => {
                      if (purchaseQueue.length === 0) {
                        window.alert('구매 대기함이 비어 있습니다.');
                        return;
                      }
                      if (purchaseQueue.length > 5) {
                        window.alert('구매 대기함은 출력 시 최대 5개까지만 지원합니다. 일부를 제거해 주세요.');
                        return;
                      }
                      printLottoSlip(purchaseQueue);
                    }}
                    disabled={purchaseQueue.length === 0}
                  >
                    대기함 출력
                  </Button>
                </Stack>

                <Divider />

                {purchaseQueue.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    아직 담긴 번호가 없습니다.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {purchaseQueue.map((draw, index) => (
                      <Paper key={draw.id} variant="outlined" sx={{ p: 1.25 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              대기 {index + 1}
                            </Typography>
                            <Button
                              size="small"
                              color="inherit"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => removeFromPurchaseQueue(draw.id)}
                            >
                              제거
                            </Button>
                          </Stack>
                          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {draw.numbers.map((n) => (
                              <NumberBall key={`${draw.id}-${n}`} n={n} size={ballSize} mr={0} />
                            ))}
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      )}
    </Grid>
  );
}
