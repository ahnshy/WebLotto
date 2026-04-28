'use client';

import * as React from 'react';
import {
  Backdrop,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import dynamic from 'next/dynamic';
import {useTranslations} from 'next-intl';
import {deleteDraws, DrawRow, fetchDraws, fetchLottoHistoryAll, LottoRow, saveDraw} from '@/app/actions';
import {useAuth} from '@/components/AuthContext';
import DrawHistoryActions from '@/components/DrawHistoryActions';
import MockDrawPanel from '@/components/MockDrawPanel';
import NumberBall from '@/components/NumberBall';
import PatternBasedPanel from '@/components/PatternBasedPanel';
import StatBasedPanel, {STAT_OPTION_LABELS, StatOption} from '@/components/StatBasedPanel';
import SyncPanel from '@/components/SyncPanel';
import {printLottoSlip} from '@/components/lottoPrint';
import {SECTION_IDS, useNav} from './NavContext';
import AiLstmPanel from './AiLstmPanel';
import AiRandomForestPanel from './AiRandomForestPanel';

const DrawList = dynamic(() => import('@/components/DrawList'), {ssr: false});
const CompareView = dynamic(() => import('@/components/CompareView'), {ssr: false});
const PatternBoards = dynamic(() => import('@/components/PatternBoards'), {
  loading: () => (
    <Backdrop open sx={{color: '#fff', zIndex: (t) => t.zIndex.modal + 1}}>
      <CircularProgress />
    </Backdrop>
  ),
  ssr: false
});
const WinningsTable = dynamic(() => import('@/components/WinningsTable'), {
  loading: () => (
    <Backdrop open sx={{color: '#fff', zIndex: (t) => t.zIndex.modal + 1}}>
      <CircularProgress />
    </Backdrop>
  ),
  ssr: false
});

export default function HomePage() {
  const t = useTranslations('HomePage');
  const {user, email, loading: authLoading} = useAuth();
  const {section} = useNav();
  const [draws, setDraws] = React.useState<DrawRow[]>([]);
  const [selected, setSelected] = React.useState<DrawRow | null>(null);
  const [history, setHistory] = React.useState<LottoRow[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [purchaseQueue, setPurchaseQueue] = React.useState<DrawRow[]>([]);
  const [loadingView, setLoadingView] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [aiModelInitializing, setAiModelInitializing] = React.useState(false);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdOnly = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const ballSize = isXs ? 22 : isMdOnly ? 28 : 36;
  const isRandomSection = section === SECTION_IDS.random;
  const isStatSection = section === SECTION_IDS.stat;
  const isPatternSection = section === SECTION_IDS.pattern;
  const isAiSection = section === SECTION_IDS.aiLstm;
  const isAiMlSection = section === SECTION_IDS.aiRandomForest;
  const isSimulationSection = section === SECTION_IDS.simulation;
  const isExtractionSection = isRandomSection || isStatSection || isPatternSection || isAiSection || isAiMlSection;
  const loadingMessage = section === SECTION_IDS.winnings ? t('loadingWinnings') : t('loading');
  const queueStorageKey = React.useMemo(() => `purchase-queue:${user?.id ?? 'guest'}`, [user?.id]);

  React.useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      setHistoryLoading(true);
      try {
        const [savedDraws, initialHistory] = await Promise.all([
          fetchDraws(user?.id ?? null),
          fetchLottoHistoryAll(30)
        ]);

        if (cancelled) return;
        setDraws(savedDraws || []);
        if (savedDraws?.length) setSelected(savedDraws[0]);
        setHistory(initialHistory || []);
        setHistoryLoading(false);

        fetchLottoHistoryAll()
          .then((allHistory) => {
            if (!cancelled) {
              setHistory(allHistory || []);
            }
          })
          .catch((error) => {
            console.error('Failed to fetch full lotto history:', error);
          });
      } catch (error) {
        console.error('Failed to fetch data:', error);
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
    if (section === SECTION_IDS.patternAnalysis) {
      setLoadingView(true);
      const timer = setTimeout(() => setLoadingView(false), 300);
      return () => clearTimeout(timer);
    }
    setLoadingView(false);
  }, [section]);

  const onGenerate = async () => {
    const numbers = new Set<number>();
    while (numbers.size < 6) numbers.add(1 + Math.floor(Math.random() * 45));
    const row = await saveDraw(Array.from(numbers).sort((a, b) => a - b), 'random', [], {id: user?.id ?? null, email});
    setDraws((prev) => [row, ...prev]);
    setSelected(row);
  };

  const toggleCheck = (id: string) => setChecked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectAll = () => setChecked(new Set(draws.map((draw) => draw.id)));
  const clearAll = () => setChecked(new Set());
  const checkedDraws = React.useMemo(() => draws.filter((draw) => checked.has(draw.id)), [draws, checked]);
  const actionTargetDraws = checkedDraws.length > 0 ? checkedDraws : selected ? [selected] : [];

  const formatDrawsForClipboard = React.useCallback((rows: DrawRow[]) => rows.map((draw, index) => `${index + 1}. ${draw.numbers.join(', ')}`).join('\n'), []);

  const copyNumbers = React.useCallback(async (rows: DrawRow[]) => {
    if (rows.length === 0) {
      window.alert(t('alerts.selectNumbersToCopy'));
      return;
    }
    await navigator.clipboard.writeText(formatDrawsForClipboard(rows));
  }, [formatDrawsForClipboard, t]);

  const handlePrintSelected = () => {
    if (actionTargetDraws.length === 0) {
      window.alert(t('alerts.selectNumbersToPrint'));
      return;
    }
    if (actionTargetDraws.length > 5) {
      window.alert(t('alerts.maxPrint'));
      return;
    }
    printLottoSlip(actionTargetDraws);
  };

  const handleCopySelected = async () => {
    try {
      await copyNumbers(actionTargetDraws);
      window.alert(t('alerts.copiedSelected'));
    } catch (error) {
      window.alert(t('alerts.copyFailed', {error: String(error)}));
    }
  };

  const handleOpenDhLottery = async () => {
    try {
      await copyNumbers(actionTargetDraws);
      window.open('https://www.dhlottery.co.kr/main', '_blank', 'noopener,noreferrer');
      window.alert(t('alerts.openedLottery'));
    } catch (error) {
      window.alert(t('alerts.openLotteryFailed', {error: String(error)}));
    }
  };

  const handleAddToPurchaseQueue = () => {
    if (actionTargetDraws.length === 0) {
      window.alert(t('alerts.selectNumbersToQueue'));
      return;
    }

    setPurchaseQueue((prev) => {
      const next = [...prev];
      for (const draw of actionTargetDraws) {
        if (!next.some((item) => item.id === draw.id)) next.push(draw);
      }
      return next.slice(0, 20);
    });
  };

  const removeSelected = async () => {
    if (checked.size === 0) return;
    const ids = Array.from(checked);
    await deleteDraws(ids, user?.id ?? null);
    setDraws((prev) => prev.filter((draw) => !checked.has(draw.id)));
    if (selected && checked.has(selected.id)) setSelected(null);
    setChecked(new Set());
  };

  const removeOne = async (id: string) => {
    await deleteDraws([id], user?.id ?? null);
    setDraws((prev) => prev.filter((draw) => draw.id !== id));
    if (selected?.id === id) setSelected(null);
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  if (section === SECTION_IDS.sync) {
    return (
      <Grid container spacing={2} sx={{flexWrap: 'wrap'}}>
        <Grid item xs={12}>
          <Paper sx={{p: 2, position: 'relative', minHeight: 200}}>
            <SyncPanel />
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} sx={{flexWrap: {xs: 'wrap', md: 'nowrap'}}}>
      <Grid item xs={12} md sx={{order: {xs: 1, md: 1}, flexBasis: {xs: '100%', md: 580}, flexGrow: 1, minWidth: 0}}>
        <Paper sx={{p: {xs: 1.5, sm: 2}, position: 'relative', minHeight: 200}}>
          {section === SECTION_IDS.winnings && <WinningsTable rows={history} />}
          {section === SECTION_IDS.patternAnalysis && <PatternBoards rows={history} />}
          {isRandomSection && (
            <Stack spacing={1.5}>
              <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} spacing={1}>
                <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('recentDraws')}</Typography>
                <Button startIcon={<AutoAwesomeIcon />} variant="contained" onClick={onGenerate} sx={{alignSelf: {xs: 'stretch', sm: 'auto'}}}>
                  {t('generateNew')}
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
              <DrawList ballSize={ballSize} draws={draws} selectedId={selected?.id ?? null} onSelect={setSelected} checkedIds={checked} onToggleCheck={toggleCheck} onDeleteOne={removeOne} />
            </Stack>
          )}
          {isStatSection && (
            <Stack spacing={1.5}>
              <StatBasedPanel
                history={history}
                ballSize={ballSize}
                onGenerated={async (numbers, options) => {
                  const row = await saveDraw(numbers, 'stat', options.map((option: StatOption) => STAT_OPTION_LABELS[option].title), {id: user?.id ?? null, email});
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
              />
              <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('history.stat')}</Typography>
              <DrawHistoryActions onSelectAll={selectAll} onClearAll={clearAll} onRemoveSelected={removeSelected} onPrintSelected={handlePrintSelected} onCopySelected={handleCopySelected} onOpenDhLottery={handleOpenDhLottery} onAddToPurchaseQueue={handleAddToPurchaseQueue} />
              <DrawList ballSize={ballSize} draws={draws} selectedId={selected?.id ?? null} onSelect={setSelected} checkedIds={checked} onToggleCheck={toggleCheck} onDeleteOne={removeOne} />
            </Stack>
          )}
          {isPatternSection && (
            <Stack spacing={1.5}>
              <PatternBasedPanel
                history={history}
                ballSize={ballSize}
                onGenerated={async (numbers) => {
                  const row = await saveDraw(numbers, 'pattern', [], {id: user?.id ?? null, email});
                  setDraws((prev) => [row, ...prev]);
                  setSelected(row);
                }}
              />
              <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('history.pattern')}</Typography>
              <DrawHistoryActions onSelectAll={selectAll} onClearAll={clearAll} onRemoveSelected={removeSelected} onPrintSelected={handlePrintSelected} onCopySelected={handleCopySelected} onOpenDhLottery={handleOpenDhLottery} onAddToPurchaseQueue={handleAddToPurchaseQueue} />
              <DrawList ballSize={ballSize} draws={draws} selectedId={selected?.id ?? null} onSelect={setSelected} checkedIds={checked} onToggleCheck={toggleCheck} onDeleteOne={removeOne} />
            </Stack>
          )}
          {isAiSection && (
            <Stack spacing={1.5}>
              <AiLstmPanel ballSize={ballSize} onGenerated={(row) => { setDraws((prev) => [row, ...prev]); setSelected(row); }} onWarmStateChange={setAiModelInitializing} ownerId={user?.id ?? null} ownerEmail={email} />
              <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('history.ai')}</Typography>
              <DrawHistoryActions onSelectAll={selectAll} onClearAll={clearAll} onRemoveSelected={removeSelected} onPrintSelected={handlePrintSelected} onCopySelected={handleCopySelected} onOpenDhLottery={handleOpenDhLottery} onAddToPurchaseQueue={handleAddToPurchaseQueue} />
              <DrawList ballSize={ballSize} draws={draws} selectedId={selected?.id ?? null} onSelect={setSelected} checkedIds={checked} onToggleCheck={toggleCheck} onDeleteOne={removeOne} />
            </Stack>
          )}
          {isAiMlSection && (
            <Stack spacing={1.5}>
              <AiRandomForestPanel ballSize={ballSize} onGenerated={(row) => { setDraws((prev) => [row, ...prev]); setSelected(row); }} onWarmStateChange={setAiModelInitializing} ownerId={user?.id ?? null} ownerEmail={email} />
              <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('history.ai')}</Typography>
              <DrawHistoryActions onSelectAll={selectAll} onClearAll={clearAll} onRemoveSelected={removeSelected} onPrintSelected={handlePrintSelected} onCopySelected={handleCopySelected} onOpenDhLottery={handleOpenDhLottery} onAddToPurchaseQueue={handleAddToPurchaseQueue} />
              <DrawList ballSize={ballSize} draws={draws} selectedId={selected?.id ?? null} onSelect={setSelected} checkedIds={checked} onToggleCheck={toggleCheck} onDeleteOne={removeOne} />
            </Stack>
          )}
          {isSimulationSection && <MockDrawPanel />}
          <Backdrop
            open={loadingView || (section === SECTION_IDS.winnings && historyLoading) || ((isAiSection || isAiMlSection) && aiModelInitializing)}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: (themeValue) => themeValue.zIndex.modal + 1,
              color: 'text.primary',
              bgcolor: (themeValue) => themeValue.palette.mode === 'dark' ? 'rgba(10, 14, 24, 0.48)' : 'rgba(255, 255, 255, 0.62)',
              backdropFilter: 'blur(3px)'
            }}
          >
            <Stack spacing={1.5} alignItems="center">
              <CircularProgress color="primary" />
              <Typography variant="body1" sx={{fontWeight: 700, color: 'text.primary', textAlign: 'center', textShadow: (themeValue) => themeValue.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.35)' : 'none'}}>
                {(isAiSection || isAiMlSection) && aiModelInitializing ? t('initializingAi') : loadingMessage}
              </Typography>
            </Stack>
          </Backdrop>
        </Paper>
      </Grid>
      {isExtractionSection && (
        <Grid item xs={12} md sx={{order: {xs: 2, md: 2}, flexBasis: {xs: '100%', md: 420}, flexGrow: 0, flexShrink: 0}}>
          <Stack spacing={2}>
            <Paper sx={{p: {xs: 1.5, sm: 2}}}>
              <CompareView ballSize={ballSize} pick={selected?.numbers ?? null} pickId={selected?.id ?? null} history={history} />
            </Paper>
            <Paper sx={{p: {xs: 1.5, sm: 2}}}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalMallOutlinedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{fontWeight: 700}}>{t('purchaseQueue.title')}</Typography>
                  </Stack>
                  <Button size="small" color="inherit" onClick={() => setPurchaseQueue([])}>{t('purchaseQueue.clear')}</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">{t('purchaseQueue.description')}</Typography>
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
                  <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => void copyNumbers(purchaseQueue)} disabled={purchaseQueue.length === 0}>{t('purchaseQueue.copy')}</Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={async () => {
                      try {
                        await copyNumbers(purchaseQueue);
                        window.open('https://www.dhlottery.co.kr/main', '_blank', 'noopener,noreferrer');
                      } catch (error) {
                        window.alert(t('alerts.openLotteryFailed', {error: String(error)}));
                      }
                    }}
                    disabled={purchaseQueue.length === 0}
                  >
                    {t('purchaseQueue.openSite')}
                  </Button>
                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => {
                      if (purchaseQueue.length === 0) {
                        window.alert(t('alerts.emptyQueue'));
                        return;
                      }
                      if (purchaseQueue.length > 5) {
                        window.alert(t('alerts.maxQueuePrint'));
                        return;
                      }
                      printLottoSlip(purchaseQueue);
                    }}
                    disabled={purchaseQueue.length === 0}
                  >
                    {t('purchaseQueue.print')}
                  </Button>
                </Stack>
                <Divider />
                {purchaseQueue.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t('purchaseQueue.empty')}</Typography>
                ) : (
                  <Stack spacing={1}>
                    {purchaseQueue.map((draw, index) => (
                      <Paper key={draw.id} variant="outlined" sx={{p: 1.25}}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{fontWeight: 700}}>{t('purchaseQueue.item', {index: index + 1})}</Typography>
                            <Button size="small" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={() => setPurchaseQueue((prev) => prev.filter((item) => item.id !== draw.id))}>
                              {t('purchaseQueue.remove')}
                            </Button>
                          </Stack>
                          <Stack direction="row" sx={{flexWrap: 'wrap', gap: 0.5}}>
                            {draw.numbers.map((number) => (
                              <NumberBall key={`${draw.id}-${number}`} n={number} size={ballSize} mr={0} />
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
