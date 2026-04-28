'use client';

import * as React from 'react';
import {IconButton, Tooltip, useMediaQuery} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {useTranslations} from 'next-intl';
import {SIDEBAR_FULL} from './Sidebar';

export default function SidebarEdgeToggle({collapsed, setCollapsed}: {collapsed: boolean; setCollapsed: (value: boolean) => void}) {
  const theme = useTheme();
  const t = useTranslations('Sidebar');
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  if (!isMdUp) return null;

  const left = collapsed ? 6 : SIDEBAR_FULL - 28;

  return (
    <Tooltip title={collapsed ? t('openSidebar') : t('closeSidebar')} placement="right" arrow>
      <IconButton
        size="small"
        sx={{position: 'fixed', top: 14, left, zIndex: (themeValue) => themeValue.zIndex.appBar + 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 3, '&:hover': {bgcolor: 'background.paper'}}}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <KeyboardDoubleArrowRightIcon /> : <KeyboardDoubleArrowLeftIcon />}
      </IconButton>
    </Tooltip>
  );
}
