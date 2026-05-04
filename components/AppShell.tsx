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
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const sidebarWidth = isMdUp ? (collapsed ? SIDEBAR_MINI : SIDEBAR_FULL) : 0;
  const isCompactHeader = !isSmUp;
  const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'night' : 'light';
  const handleChange = (_: unknown, value: 'light' | 'dark' | 'night' | null) => {
    if (value) setMode(value);
  };
  const handleCycleMode = () => setMode(nextMode);
  const modeLabel = mode === 'light' ? t('light') : mode === 'dark' ? t('dark') : t('night');
  const nextModeLabel = nextMode === 'light' ? t('light') : nextMode === 'dark' ? t('dark') : t('night');
  const modeIcon = mode === 'light' ? <WbSunnyIcon fontSize="small" /> : mode === 'dark' ? <DarkModeIcon fontSize="small" /> : <NightlightRoundIcon fontSize="small" />;

  return (
    <ErrorBoundary>
      <Box sx={{width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'row', overflow: 'hidden'}}>
        {isMdUp && (
          <Box sx={{width: sidebarWidth, height: '100%', flexShrink: 0, transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden'}}>
            <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />
          </Box>
        )}

        {!isMdUp && <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} />}

        <SidebarEdgeToggle collapsed={collapsed} setCollapsed={setCollapsed} />

        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0}}>
          <AppBar position="relative" sx={{width: '100%', zIndex: theme.zIndex.drawer + 2, flexShrink: 0}}>
            <Toolbar
              sx={{
                gap: 0.75,
                px: {xs: 1, sm: 2, md: 3},
                py: {xs: 0.75, sm: 1},
                minHeight: {xs: 56, sm: 72},
                alignItems: 'center',
                flexWrap: 'nowrap'
              }}
            >
              <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0}}>
                {!isMdUp && (
                  <IconButton color="inherit" onClick={() => setOpen(true)} aria-label={t('openDrawer')} edge="start" sx={{flexShrink: 0, p: 1}}>
                    <MenuIcon />
                  </IconButton>
                )}
                <Typography variant={isCompactHeader ? 'subtitle2' : 'h6'} sx={{fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  WebLotto
                </Typography>
              </Box>

              <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: {xs: 0.5, sm: 1}, flexShrink: 0, ml: 'auto'}}>
                <LocaleSwitcher compact={isCompactHeader} iconOnly={isCompactHeader} />
                {isCompactHeader ? (
                  <Tooltip title={`${modeLabel} -> ${nextModeLabel}`}>
                    <IconButton
                      color="inherit"
                      onClick={handleCycleMode}
                      aria-label={nextModeLabel}
                      sx={{border: '1px solid rgba(255,255,255,0.24)', borderRadius: 1.5, p: 0.8}}
                    >
                      {modeIcon}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <ToggleButtonGroup
                    value={mode}
                    exclusive
                    size="small"
                    onChange={handleChange}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.06)',
                      borderRadius: 1.5,
                      '& .MuiToggleButton-root': {
                        color: 'inherit',
                        borderColor: 'rgba(255,255,255,0.2)',
                        px: {xs: 0.7, sm: 1.1},
                        py: {xs: 0.45, sm: 0.65}
                      }
                    }}
                  >
                    <Tooltip title={t('light')}><ToggleButton value="light" aria-label={t('light')}><WbSunnyIcon fontSize="small" /></ToggleButton></Tooltip>
                    <Tooltip title={t('dark')}><ToggleButton value="dark" aria-label={t('dark')}><DarkModeIcon fontSize="small" /></ToggleButton></Tooltip>
                    <Tooltip title={t('night')}><ToggleButton value="night" aria-label={t('night')}><NightlightRoundIcon fontSize="small" /></ToggleButton></Tooltip>
                  </ToggleButtonGroup>
                )}
                {email ? (
                  <Tooltip title={`${displayName ?? email} (${email})`}>
                    {isCompactHeader ? (
                      <IconButton
                        color="inherit"
                        onClick={() => void signOut()}
                        aria-label="Sign out"
                        sx={{border: '1px solid rgba(255,255,255,0.24)', borderRadius: 1.5, p: 0.6}}
                      >
                        <Avatar src={avatarUrl ?? undefined} sx={{width: 26, height: 26, fontSize: 12}}>
                          {(displayName ?? email)?.[0]?.toUpperCase()}
                        </Avatar>
                      </IconButton>
                    ) : (
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
                    )}
                  </Tooltip>
                ) : (
                  isCompactHeader ? (
                    <Tooltip title={t('googleLogin')}>
                      <span>
                        <IconButton
                          color="inherit"
                          onClick={() => void signInWithGoogle()}
                          disabled={loading}
                          aria-label={t('googleLogin')}
                          sx={{border: '1px solid rgba(255,255,255,0.24)', borderRadius: 1.5, p: 0.8}}
                        >
                          <GoogleIcon fontSize="small" />
                        </IconButton>
                      </span>
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
                  )
                )}
              </Box>
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
