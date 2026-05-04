'use client';

import * as React from 'react';
import {alpha, Box, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography, useMediaQuery} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import CasinoIcon from '@mui/icons-material/Casino';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HubIcon from '@mui/icons-material/Hub';
import PolylineIcon from '@mui/icons-material/Polyline';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {SECTION_IDS, Section, useNav} from './NavContext';

export const SIDEBAR_FULL = 280;
export const SIDEBAR_MINI = 80;

function ItemText({primary, collapsed}: {primary: string; collapsed: boolean}) {
  return collapsed ? null : <ListItemText primary={primary} />;
}

export default function Sidebar({
  open,
  onClose,
  collapsed,
  setCollapsed
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const {section, setSection} = useNav();
  const t = useTranslations('Sidebar');
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [openAnalysis, setOpenAnalysis] = React.useState(true);
  const [openExtract, setOpenExtract] = React.useState(true);
  const [openSimulation, setOpenSimulation] = React.useState(true);

  const width = isMdUp ? (collapsed ? SIDEBAR_MINI : SIDEBAR_FULL) : SIDEBAR_FULL;
  const isDark = theme.palette.mode === 'dark';
  const isNight = theme.palette.background.paper === '#151b2f';
  const menuItemHoverBg = isNight ? alpha('#4f46e5', 0.15) : isDark ? alpha('#90caf9', 0.12) : alpha('#3b82f6', 0.08);
  const menuItemSelectedBg = isNight ? alpha('#4f46e5', 0.25) : isDark ? alpha('#90caf9', 0.2) : alpha('#3b82f6', 0.12);

  const selectSection = (nextSection: Section) => {
    setSection(nextSection);
    if (!isMdUp) onClose();
  };

  const itemSx = (selected: boolean, nested = false) => ({
    borderRadius: 10,
    mx: nested ? 0.5 : 0,
    mb: 0.5,
    px: nested ? undefined : 1.5,
    pl: nested ? (collapsed ? 1.5 : 3) : undefined,
    py: nested ? 0.875 : 1,
    bgcolor: selected ? menuItemSelectedBg : 'transparent',
    '&:hover': {bgcolor: menuItemHoverBg},
    '&.Mui-selected': {bgcolor: menuItemSelectedBg, '&:hover': {bgcolor: menuItemSelectedBg}},
    transition: 'all 0.2s ease'
  });

  const content = (
    <Box role="presentation" sx={{width, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: theme.palette.background.paper, borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'}}>
      <Box sx={{display: 'flex', alignItems: 'center', gap: collapsed ? 0.5 : 1.5, px: 1.5, py: 1.5, height: 64, borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`}}>
        <IconButton
          onClick={() => {
            if (isMdUp && collapsed) setCollapsed(false);
          }}
          disableRipple={!collapsed}
          sx={{width: 36, height: 36, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), flexShrink: 0, cursor: collapsed && isMdUp ? 'pointer' : 'default', '&:hover': {bgcolor: alpha(theme.palette.primary.main, collapsed && isMdUp ? 0.18 : 0.1)}}}
        >
          <Image src="/favicon-32.png" alt="WebLotto" width={24} height={24} />
        </IconButton>

        {!collapsed && <Typography sx={{fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>WebLotto</Typography>}
        <Box sx={{flex: 1}} />

        {isMdUp && !collapsed && (
          <Tooltip title={t('closeSidebar')} placement="bottom" arrow>
            <IconButton size="small" onClick={() => setCollapsed(true)} sx={{width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(theme.palette.text.primary, 0.08), border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, '&:hover': {bgcolor: alpha(theme.palette.text.primary, 0.12)}}}>
              <Box sx={{position: 'relative', width: 16, height: 16}}>
                <Box sx={{position: 'absolute', inset: 0, borderRadius: '5px', border: `1.5px solid ${alpha(theme.palette.text.primary, 0.75)}`}} />
                <Box sx={{position: 'absolute', top: 2, bottom: 2, right: 3, width: 1.5, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.75)}} />
              </Box>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <List sx={{pt: 1.5, px: 1, flex: 1, overflow: 'auto', '&::-webkit-scrollbar': {width: '6px'}, '&::-webkit-scrollbar-track': {bgcolor: 'transparent'}, '&::-webkit-scrollbar-thumb': {bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: '3px', '&:hover': {bgcolor: alpha(theme.palette.text.primary, 0.15)}}}}>
        <ListItemButton onClick={() => setOpenAnalysis((prev) => !prev)} sx={itemSx(false)}>
          <ListItemIcon sx={{minWidth: 40}}><AnalyticsIcon sx={{fontSize: '1.25rem'}} /></ListItemIcon>
          <ItemText collapsed={collapsed} primary={t('analysis')} />
          {!collapsed && (openAnalysis ? <ExpandLess sx={{fontSize: '1.2rem'}} /> : <ExpandMore sx={{fontSize: '1.2rem'}} />)}
        </ListItemButton>
        <Collapse in={openAnalysis || collapsed} timeout="auto" unmountOnExit={!collapsed}>
          <List component="div" disablePadding sx={{mb: 1}}>
            <ListItemButton selected={section === SECTION_IDS.winnings} sx={itemSx(section === SECTION_IDS.winnings, true)} onClick={() => selectSection(SECTION_IDS.winnings)}>
              <ListItemIcon sx={{minWidth: 40}}><EmojiEventsIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('winnings')} />
            </ListItemButton>
            <ListItemButton selected={section === SECTION_IDS.patternAnalysis} sx={itemSx(section === SECTION_IDS.patternAnalysis, true)} onClick={() => selectSection(SECTION_IDS.patternAnalysis)}>
              <ListItemIcon sx={{minWidth: 40}}><BubbleChartIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('patternAnalysis')} />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider sx={{my: 0.5, opacity: 0.5}} />

        <ListItemButton onClick={() => setOpenExtract((prev) => !prev)} sx={itemSx(false)}>
          <ListItemIcon sx={{minWidth: 40}}><CasinoIcon sx={{fontSize: '1.25rem'}} /></ListItemIcon>
          <ItemText collapsed={collapsed} primary={t('draw')} />
          {!collapsed && (openExtract ? <ExpandLess sx={{fontSize: '1.2rem'}} /> : <ExpandMore sx={{fontSize: '1.2rem'}} />)}
        </ListItemButton>
        <Collapse in={openExtract || collapsed} timeout="auto" unmountOnExit={!collapsed}>
          <List component="div" disablePadding sx={{mb: 1}}>
            <ListItemButton selected={section === SECTION_IDS.random} sx={itemSx(section === SECTION_IDS.random, true)} onClick={() => selectSection(SECTION_IDS.random)}>
              <ListItemIcon sx={{minWidth: 40}}><AutoFixHighIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('random')} />
            </ListItemButton>
            <ListItemButton selected={section === SECTION_IDS.stat} sx={itemSx(section === SECTION_IDS.stat, true)} onClick={() => selectSection(SECTION_IDS.stat)}>
              <ListItemIcon sx={{minWidth: 40}}><QueryStatsIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('stat')} />
            </ListItemButton>
            <ListItemButton selected={section === SECTION_IDS.pattern} sx={itemSx(section === SECTION_IDS.pattern, true)} onClick={() => selectSection(SECTION_IDS.pattern)}>
              <ListItemIcon sx={{minWidth: 40}}><PolylineIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('pattern')} />
            </ListItemButton>
            <ListItemButton selected={section === SECTION_IDS.aiLstm} sx={itemSx(section === SECTION_IDS.aiLstm, true)} onClick={() => selectSection(SECTION_IDS.aiLstm)}>
              <ListItemIcon sx={{minWidth: 40}}><PsychologyAltIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('aiLstm')} />
            </ListItemButton>
            <ListItemButton selected={section === SECTION_IDS.aiRandomForest} sx={itemSx(section === SECTION_IDS.aiRandomForest, true)} onClick={() => selectSection(SECTION_IDS.aiRandomForest)}>
              <ListItemIcon sx={{minWidth: 40}}><HubIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('aiRandomForest')} />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider sx={{my: 0.5, opacity: 0.5}} />

        <ListItemButton onClick={() => setOpenSimulation((prev) => !prev)} sx={itemSx(false)}>
          <ListItemIcon sx={{minWidth: 40}}><SportsEsportsIcon sx={{fontSize: '1.25rem'}} /></ListItemIcon>
          <ItemText collapsed={collapsed} primary={t('simulation')} />
          {!collapsed && (openSimulation ? <ExpandLess sx={{fontSize: '1.2rem'}} /> : <ExpandMore sx={{fontSize: '1.2rem'}} />)}
        </ListItemButton>
        <Collapse in={openSimulation || collapsed} timeout="auto" unmountOnExit={!collapsed}>
          <List component="div" disablePadding sx={{mb: 1}}>
            <ListItemButton selected={section === SECTION_IDS.simulation} sx={itemSx(section === SECTION_IDS.simulation, true)} onClick={() => selectSection(SECTION_IDS.simulation)}>
              <ListItemIcon sx={{minWidth: 40}}><SportsEsportsIcon sx={{fontSize: '1.1rem'}} /></ListItemIcon>
              <ItemText collapsed={collapsed} primary={t('simulation')} />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider sx={{my: 0.5, opacity: 0.5}} />

        <ListItemButton selected={section === SECTION_IDS.sync} sx={itemSx(section === SECTION_IDS.sync)} onClick={() => selectSection(SECTION_IDS.sync)}>
          <ListItemIcon sx={{minWidth: 40}}><CloudSyncIcon sx={{fontSize: '1.25rem'}} /></ListItemIcon>
          <ItemText collapsed={collapsed} primary={t('sync')} />
        </ListItemButton>
      </List>
    </Box>
  );

  return isMdUp ? (
    <Drawer variant="permanent" open sx={{height: '100%', '& .MuiDrawer-paper': {position: 'relative', width, height: '100%', transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box', overflow: 'hidden'}}}>
      {content}
    </Drawer>
  ) : (
    <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{keepMounted: true}} sx={{'& .MuiDrawer-paper': {width, boxSizing: 'border-box'}}}>
      {content}
    </Drawer>
  );
}
