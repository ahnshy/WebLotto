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
import { useTheme } from '@mui/material/styles';
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

  return (
    <List dense disablePadding sx={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
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
