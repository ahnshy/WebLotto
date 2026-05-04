'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_NEXT_PATH = '/ko';

function getSafeNext(rawNext: string | null) {
  if (!rawNext) return DEFAULT_NEXT_PATH;

  try {
    const decoded = decodeURIComponent(rawNext);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    // Ignore malformed next values and fall back to the default route.
  }

  return DEFAULT_NEXT_PATH;
}

function buildAndroidReturnUrl(search: string, hash: string) {
  return `io.github.ahnshy.weblotto://auth-callback${search || ''}${hash || ''}`;
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState('로그인 정보를 확인하는 중입니다...');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get('code');
      const errorDescription =
        currentUrl.searchParams.get('error_description')
        || currentUrl.searchParams.get('error')
        || '';
      const nextPath = getSafeNext(searchParams.get('next'));
      const ua = window.navigator.userAgent || '';
      const isChromeOrExternalBrowser = !ua.includes('WebLottoAndroid');
      const isAndroidDevice = /Android/i.test(ua);

      if (errorDescription) {
        throw new Error(errorDescription);
      }

      // Android 앱 로그인은 가능하면 Supabase가 custom scheme으로 직접 돌려보내는 것이
      // 가장 안정적입니다. 그래도 브라우저가 이 웹 callback에 도착한 경우에는 즉시
      // 앱 deep link를 열어 Chrome에 404/완료 화면이 남지 않도록 합니다.
      if (isAndroidDevice && isChromeOrExternalBrowser && code) {
        setMessage('WebLotto 앱으로 돌아가는 중입니다...');
        window.location.replace(buildAndroidReturnUrl(window.location.search, window.location.hash));
        return;
      }

      if (code) {
        setMessage('로그인 세션을 생성하는 중입니다...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else if (window.location.hash) {
        // Implicit flow fallback: supabase-js can detect the session from the URL hash.
        await supabase.auth.getSession();
      } else {
        await supabase.auth.getSession();
      }

      if (cancelled) return;
      setMessage('로그인이 완료되었습니다. 앱 화면으로 이동합니다...');
      router.replace(nextPath);
    }

    completeAuth().catch((authError) => {
      if (cancelled) return;
      setError(authError instanceof Error ? authError.message : '로그인 처리 중 오류가 발생했습니다.');
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        color: '#e5e7eb',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ maxWidth: 420 }}>
        {error ? (
          <>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
              Google 로그인 처리 실패
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#cbd5e1', wordBreak: 'break-word' }}>
              {error}
            </Typography>
            <Button variant="contained" onClick={() => router.replace(DEFAULT_NEXT_PATH)}>
              WebLotto로 돌아가기
            </Button>
          </>
        ) : (
          <>
            <CircularProgress size={34} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
              WebLotto
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
              {message}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
