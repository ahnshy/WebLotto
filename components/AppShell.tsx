'use client';
import * as React from 'react';
import { AppBar, Box, Toolbar, Typography, ToggleButtonGroup, ToggleButton, Tooltip, IconButton, useMediaQuery } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useThemeMode } from '@/app/theme/ThemeProviderRoot';
import Sidebar, { SIDEBAR_FULL, SIDEBAR_MINI } from './Sidebar';
import SidebarEdgeToggle from './SidebarEdgeToggle';
import ErrorBoundary from './ErrorBoundary';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useThemeMode();
  const handleChange = (_: any, val: 'light' | 'dark' | 'night' | null) => { if (val) setMode(val); };
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const sidebarWidth = isMdUp ? (collapsed ? SIDEBAR_MINI : SIDEBAR_FULL) : 0;

  return (
    <ErrorBoundary>
      {/* ChatGPT 스타일: 사이드바가 top~bottom 전체 높이 차지 */}
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* 사이드바 - 화면 전체 높이 */}
        {isMdUp && (
          <Box sx={{
            width: sidebarWidth,
            height: '100%',
            flexShrink: 0,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}>
            <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />
          </Box>
        )}

        {!isMdUp && (
          <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        <SidebarEdgeToggle collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* 우측 영역: 헤더 + 콘텐츠 (세로 배치) */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* 헤더 */}
          <AppBar position="relative" sx={{
            width: '100%',
            zIndex: theme.zIndex.drawer + 2,
            flexShrink: 0,
          }}>
            <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2, md: 3 } }}>
              {!isMdUp && (<IconButton color="inherit" onClick={() => setOpen(true)} aria-label="open drawer"><MenuIcon /></IconButton>)}
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>WebLotto</Typography>
              <ToggleButtonGroup value={mode} exclusive size="small" onChange={handleChange}
                sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1.5, '& .MuiToggleButton-root': { color: 'inherit', borderColor: 'rgba(255,255,255,0.2)' } }}>
                <Tooltip title="Light"><ToggleButton value="light" aria-label="light-mode"><WbSunnyIcon fontSize="small" /></ToggleButton></Tooltip>
                <Tooltip title="Dark"><ToggleButton value="dark" aria-label="dark-mode"><DarkModeIcon fontSize="small" /></ToggleButton></Tooltip>
                <Tooltip title="Night"><ToggleButton value="night" aria-label="night-mode"><NightlightRoundIcon fontSize="small" /></ToggleButton></Tooltip>
              </ToggleButtonGroup>
            </Toolbar>
          </AppBar>

          {/* 스크롤 가능한 콘텐츠 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              width: '100%',
              px: { xs: 1.5, sm: 2, md: 3 },
              py: 2,
              '&::-webkit-scrollbar': { width: '10px' },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '5px',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                },
              },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}
