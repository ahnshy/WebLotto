'use client';

import * as React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NumberBall from './NumberBall';
import type { DrawRow } from '@/app/actions';

const METHOD_LABELS: Record<string, string> = {
  random: '난수',
  stat: '통계',
  pattern: '패턴',
  lstm: '딥러닝',
  random_forest: '머신러닝',
  unknown: '미분류',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ResponsiveBallRow({
  numbers,
  maxSize,
}: {
  numbers: number[];
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

  const gap = width > 260 ? 4 : width > 210 ? 3 : 2;
  const totalGap = gap * Math.max(0, numbers.length - 1);
  const computed = ((width || maxSize * numbers.length) - totalGap) / Math.max(1, numbers.length);
  const size = clamp(Math.floor(computed), 14, maxSize);

  return (
    <Box
      ref={rowRef}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: `${gap}px`,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {numbers.map((number, index) => (
        <NumberBall key={`${number}-${index}`} n={number} size={size} mr={0} />
      ))}
    </Box>
  );
}

export default function DrawList({
  draws,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  onDeleteOne,
  ballSize,
}: {
  draws: DrawRow[];
  selectedId?: string | null;
  onSelect: (r: DrawRow) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onDeleteOne: (id: string) => void;
  ballSize: number;
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const size = isXs ? Math.min(ballSize, 20) : ballSize;
  const isNight = theme.palette.background.paper === '#151b2f';
  const scrollbarThumb = isNight
    ? alpha('#4f46e5', 0.45)
    : theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.light, 0.45)
      : alpha(theme.palette.primary.main, 0.35);
  const scrollbarThumbHover = isNight
    ? alpha('#4f46e5', 0.7)
    : theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.light, 0.65)
      : alpha(theme.palette.primary.main, 0.55);
  const scrollbarTrack = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.06);

  return (
    <List
      dense
      disablePadding
      sx={{
        width: '100%',
        maxHeight: '70vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: scrollbarTrack,
          borderRadius: 999,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: scrollbarThumb,
          borderRadius: 999,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          bgcolor: scrollbarThumbHover,
        },
      }}
    >
      {draws.map((draw) => (
        <ListItem key={draw.id} disablePadding disableGutters sx={{ overflowX: 'hidden' }}>
          <ListItemButton
            selected={selectedId === draw.id}
            onClick={() => onSelect(draw)}
            sx={{ px: 1, py: 0.75, minWidth: 0, alignItems: 'flex-start' }}
          >
            <ListItemIcon
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheck(draw.id);
              }}
              sx={{ minWidth: 36, pt: 0.25 }}
            >
              <Checkbox edge="start" checked={checkedIds.has(draw.id)} tabIndex={-1} disableRipple size="small" />
            </ListItemIcon>

            <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.5}>
              <Stack direction="row" alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>
                <Box
                  sx={{
                    flexShrink: 0,
                    px: 0.75,
                    py: 0.2,
                    borderRadius: 999,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    lineHeight: 1.4,
                    color: 'primary.main',
                    bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.2 : 0.1),
                    border: (t) => `1px solid ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.28 : 0.16)}`,
                  }}
                >
                  {METHOD_LABELS[draw.extraction_method ?? 'unknown'] ?? '미분류'}
                </Box>

                {(draw.extraction_tags ?? []).map((tag) => (
                  <Box
                    key={`${draw.id}-${tag}`}
                    sx={{
                      flexShrink: 0,
                      px: 0.7,
                      py: 0.16,
                      borderRadius: 999,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      color: 'text.secondary',
                      bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.14 : 0.06),
                      border: (t) => `1px solid ${alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.08)}`,
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Stack>

              <ResponsiveBallRow numbers={draw.numbers} maxSize={size} />

              <Typography variant="caption" sx={{ opacity: 0.55, display: 'block', lineHeight: 1.2 }}>
                {new Date(draw.created_at).toLocaleString()}
              </Typography>
            </Stack>

            <Tooltip title="항목 삭제">
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteOne(draw.id);
                }}
                sx={{ ml: 0.5, flexShrink: 0 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
