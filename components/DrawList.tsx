'use client';
import {
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
import { alpha, useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import NumberBall from './NumberBall';
import type { DrawRow } from '@/app/actions';

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
  // 작은 화면에서 볼 크기 더 축소
  const size = isXs ? Math.min(ballSize, 20) : ballSize;
  // 볼 간격: 작은 화면에서 더 촘촘하게
  const gap = isXs ? 0.25 : 0.5;
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
        overflowX: 'auto',
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
      {draws.map((d) => (
        <ListItem
          key={d.id}
          disablePadding
          disableGutters
          sx={{ overflowX: 'hidden' }}
        >
          <ListItemButton
            selected={selectedId === d.id}
            onClick={() => onSelect(d)}
            sx={{ px: 1, py: 0.5, minWidth: 0 }}
          >
            {/* 체크박스 */}
            <ListItemIcon
              onClick={(e) => { e.stopPropagation(); onToggleCheck(d.id); }}
              sx={{ minWidth: 36 }}
            >
              <Checkbox
                edge="start"
                checked={checkedIds.has(d.id)}
                tabIndex={-1}
                disableRipple
                size="small"
              />
            </ListItemIcon>

            {/* 번호 + 날짜 */}
            <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
              <Stack
                direction="row"
                alignItems="center"
                sx={{ flexWrap: 'wrap', gap: gap, minWidth: 0 }}
              >
                {d.numbers.map((n) => (
                  <NumberBall key={n} n={n} size={size} mr={0} />
                ))}
              </Stack>
              <Typography
                variant="caption"
                sx={{ opacity: 0.55, display: 'block', lineHeight: 1.2 }}
              >
                {new Date(d.created_at).toLocaleString()}
              </Typography>
            </Stack>

            {/* 삭제 버튼 */}
            <Tooltip title="이 항목 삭제">
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => { e.stopPropagation(); onDeleteOne(d.id); }}
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
