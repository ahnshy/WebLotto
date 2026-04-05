'use client';

import * as React from 'react';
import { Button, Stack } from '@mui/material';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';

export default function DrawHistoryActions({
  onSelectAll,
  onClearAll,
  onRemoveSelected,
  onPrintSelected,
  onCopySelected,
  onOpenDhLottery,
  onAddToPurchaseQueue,
}: {
  onSelectAll: () => void;
  onClearAll: () => void;
  onRemoveSelected: () => void;
  onPrintSelected: () => void;
  onCopySelected: () => void;
  onOpenDhLottery: () => void;
  onAddToPurchaseQueue: () => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={1}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{
          alignSelf: { xs: 'stretch', md: 'flex-start' },
          '& .action-button': {
            textTransform: 'none',
            fontWeight: 700,
            px: 1.25,
            gap: 1,
            minWidth: { xs: 'calc(50% - 4px)', sm: 'auto' },
          },
        }}
      >
        <Button className="action-button" variant="outlined" size="small" onClick={onSelectAll} startIcon={<SelectAllIcon />}>전체 선택</Button>
        <Button className="action-button" variant="outlined" size="small" onClick={onClearAll} startIcon={<IndeterminateCheckBoxOutlinedIcon />}>선택 해제</Button>
        <Button
          className="action-button"
          variant="outlined"
          size="small"
          color="error"
          onClick={onRemoveSelected}
          startIcon={<DeleteSweepIcon />}
          sx={{
            bgcolor: (t) => t.palette.mode === 'light' ? 'error.50' : 'rgba(244,67,54,.10)',
            '&:hover': {
              bgcolor: (t) => t.palette.mode === 'light' ? 'error.100' : 'rgba(244,67,54,.18)',
            },
          }}
        >
          선택 삭제
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{
          alignSelf: { xs: 'stretch', md: 'flex-start' },
          '& .action-button': {
            minWidth: { xs: 'calc(50% - 4px)', sm: 'auto' },
          },
        }}
      >
        <Button
          className="action-button"
          size="small"
          variant="outlined"
          onClick={onCopySelected}
          startIcon={<ContentCopyIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          번호 복사
        </Button>
        <Button
          className="action-button"
          size="small"
          variant="outlined"
          onClick={onOpenDhLottery}
          startIcon={<OpenInNewIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          동행복권 열기
        </Button>
        <Button
          className="action-button"
          size="small"
          variant="outlined"
          onClick={onAddToPurchaseQueue}
          startIcon={<ShoppingCartCheckoutIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          구매 대기함
        </Button>
        <Button
          className="action-button"
          size="small"
          variant="contained"
          color="inherit"
          onClick={onPrintSelected}
          startIcon={<PrintIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          출력
        </Button>
      </Stack>
    </Stack>
  );
}
