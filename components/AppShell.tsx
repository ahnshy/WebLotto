'use client';

import * as React from 'react';
import {AppBar, Avatar, Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Toolbar, Tooltip, Typography, useMediaQuery} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import {useTheme} from '@mui/material/styles';
import {useTranslations} from 'next-intl';
import {useThemeMode} from '@/app/theme/ThemeProviderRoot';
import ErrorBoundary from './ErrorBoundary';
import LocaleSwitcher from './LocaleSwitcher';
import Sidebar, {SIDEBAR_FULL, SIDEBAR_MINI} from './Sidebar';
import SidebarEdgeToggle from './SidebarEdgeToggle';
import {useAuth} from './AuthContext';

export default function AppShell({children}: {children: React.ReactNode}) {
  const {mode, setMode} = useThemeMode();
  const {email, displayName, avatarUrl, loading, signInWithGoogle, signOut} = useAuth();
  const t = useTranslations('AppShell');
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const sidebarWidth = isMdUp ? (collapsed ? SIDEBAR_MINI : SIDEBAR_FULL) : 0;
  const handleChange = (_: unknown, value: 'light' | 'dark' | 'night' | null) => {
    if (value) setMode(value);
  };

  return (
    <ErrorBoundary>
      <Box sx={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden'}}>
        {isMdUp && (
          <Box sx={{width: sidebarWidth, height: '100%', flexShrink: 0, transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden'}}>
            <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />
          </Box>
        )}

        {!isMdUp && <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />}

        <SidebarEdgeToggle collapsed={collapsed} setCollapsed={setCollapsed} />

        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0}}>
          <AppBar position="relative" sx={{width: '100%', zIndex: theme.zIndex.drawer + 2, flexShrink: 0}}>
            <Toolbar sx={{gap: 1, px: {xs: 1, sm: 2, md: 3}}}>
              {!isMdUp && (
                <IconButton color="inherit" onClick={() => setOpen(true)} aria-label={t('openDrawer')}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{flex: 1, fontWeight: 700}}>WebLotto</Typography>
              <LocaleSwitcher />
              <ToggleButtonGroup
                value={mode}
                exclusive
                size="small"
                onChange={handleChange}
                sx={{bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1.5, '& .MuiToggleButton-root': {color: 'inherit', borderColor: 'rgba(255,255,255,0.2)'}}}
              >
                <Tooltip title={t('light')}><ToggleButton value="light" aria-label={t('light')}><WbSunnyIcon fontSize="small" /></ToggleButton></Tooltip>
                <Tooltip title={t('dark')}><ToggleButton value="dark" aria-label={t('dark')}><DarkModeIcon fontSize="small" /></ToggleButton></Tooltip>
                <Tooltip title={t('night')}><ToggleButton value="night" aria-label={t('night')}><NightlightRoundIcon fontSize="small" /></ToggleButton></Tooltip>
              </ToggleButtonGroup>
              {email ? (
                <Tooltip title={`${displayName ?? email} (${email})`}>
                  <Button
                    color="inherit"
                    variant="outlined"
                    onClick={() => void signOut()}
                    startIcon={<Avatar src={avatarUrl ?? undefined} sx={{width: 24, height: 24, fontSize: 12}}>{(displayName ?? email)?.[0]?.toUpperCase()}</Avatar>}
                    endIcon={<LogoutIcon fontSize="small" />}
                    sx={{textTransform: 'none', borderColor: 'rgba(255,255,255,0.24)', color: 'inherit', maxWidth: 240, '&:hover': {borderColor: 'rgba(255,255,255,0.4)'}}}
                  >
                    <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140}}>
                      {displayName ?? email}
                    </Box>
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={() => void signInWithGoogle()}
                  startIcon={<GoogleIcon />}
                  disabled={loading}
                  sx={{textTransform: 'none', borderColor: 'rgba(255,255,255,0.24)', color: 'inherit', '&:hover': {borderColor: 'rgba(255,255,255,0.4)'}}}
                >
                  {t('googleLogin')}
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              width: '100%',
              px: {xs: 1.5, sm: 2, md: 3},
              py: 2,
              '&::-webkit-scrollbar': {width: '10px'},
              '&::-webkit-scrollbar-track': {background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'},
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '5px',
                '&:hover': {background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              }
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}
