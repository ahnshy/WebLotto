'use client';

import * as React from 'react';
import { Button, ButtonGroup, Stack } from '@mui/material';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PrintIcon from '@mui/icons-material/Print';

export default function DrawHistoryActions({
  onSelectAll,
  onClearAll,
  onRemoveSelected,
  onPrintSelected,
}: {
  onSelectAll: () => void;
  onClearAll: () => void;
  onRemoveSelected: () => void;
  onPrintSelected: () => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={1}
    >
      <ButtonGroup
        variant="outlined"
        size="small"
        sx={{
          alignSelf: 'flex-start',
          borderRadius: 2,
          overflow: 'hidden',
          flexWrap: 'wrap',
          '& .MuiButton-root': {
            textTransform: 'none',
            fontWeight: 700,
            px: 1.5,
            gap: 1,
            borderColor: 'divider',
          },
        }}
      >
        <Button onClick={onSelectAll} startIcon={<SelectAllIcon />}>전체 선택</Button>
        <Button onClick={onClearAll} startIcon={<IndeterminateCheckBoxOutlinedIcon />}>선택 해제</Button>
        <Button
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
      </ButtonGroup>

      <Button
        variant="contained"
        color="inherit"
        onClick={onPrintSelected}
        startIcon={<PrintIcon />}
        sx={{
          alignSelf: { xs: 'stretch', md: 'flex-start' },
          textTransform: 'none',
          fontWeight: 700,
        }}
      >
        출력
      </Button>
    </Stack>
  );
}
