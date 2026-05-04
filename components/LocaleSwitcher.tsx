'use client';

import * as React from 'react';
import {alpha, Button, ListItemText, Menu, MenuItem, Typography} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import {useLocale, useTranslations} from 'next-intl';
import type {AppLocale} from '@/i18n';
import {usePathname, useRouter} from '@/i18n/navigation';

const STORAGE_KEY = 'preferred-locale';
const COOKIE_KEY = 'NEXT_LOCALE';
const COOKIE_AGE = 60 * 60 * 24 * 365;

const OPTIONS: Array<{value: AppLocale; label: string}> = [
  {value: 'en', label: 'EN'},
  {value: 'ko', label: 'KO'}
];

function setLocaleCache(locale: AppLocale) {
  window.localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=${COOKIE_AGE}; samesite=lax`;
}

export default function LocaleSwitcher({compact = false}: {compact?: boolean}) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('LocaleSwitcher');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  React.useEffect(() => {
    setLocaleCache(locale);
  }, [locale]);

  const handleSelect = (nextLocale: AppLocale) => {
    setAnchorEl(null);
    if (nextLocale === locale) return;
    setLocaleCache(nextLocale);
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <>
      <Button
        color="inherit"
        aria-label={t('label')}
        aria-haspopup="menu"
        aria-expanded={anchorEl ? 'true' : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          minWidth: 0,
          px: compact ? 0.875 : 1.25,
          py: compact ? 0.5 : 0.6,
          borderRadius: '18px',
          textTransform: 'none',
          border: '2px solid',
          borderColor: '#5ea4ff',
          bgcolor: alpha('#0d1629', 0.9),
          color: '#fff',
          gap: compact ? 0.5 : 0.75,
          fontWeight: 800,
          lineHeight: 1,
          '&:hover': {
            borderColor: '#7db6ff',
            bgcolor: alpha('#15213a', 0.96)
          }
        }}
      >
        <LanguageRoundedIcon sx={{fontSize: compact ? '0.95rem' : '1rem'}} />
        <Typography component="span" sx={{fontSize: compact ? '0.82rem' : '0.92rem', fontWeight: 800}}>
          {locale.toUpperCase()}
        </Typography>
        <KeyboardArrowDownRoundedIcon sx={{fontSize: compact ? '0.9rem' : '1rem'}} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              minWidth: 108,
              borderRadius: '0 0 14px 14px',
              bgcolor: '#455168',
              color: '#fff',
              overflow: 'hidden',
              boxShadow: '0 14px 28px rgba(0,0,0,0.28)'
            }
          }
        }}
      >
        {OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === locale}
            onClick={() => handleSelect(option.value)}
            sx={{
              minHeight: 42,
              px: 2,
              fontWeight: 800,
              '&.Mui-selected': {
                bgcolor: '#546d92'
              },
              '&.Mui-selected:hover': {
                bgcolor: '#5d779f'
              }
            }}
          >
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
