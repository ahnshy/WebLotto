'use client';
import * as React from 'react';
import { Button, Stack, CircularProgress, Snackbar, Alert } from '@mui/material';

function generate(): number[] {
  const s = new Set<number>();
  while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45));
  return Array.from(s).sort((a, b) => a - b);
}

export default function Generator({ onNewAction }: { onNewAction: (nums: number[]) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleGenerate = async () => {
    const nums = generate();
    onNewAction(nums);

    // Supabase에 예측 번호 저장
    setLoading(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: nums }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = 'Failed to save prediction';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          errorMsg = `HTTP ${res.status}: ${text || 'Empty response'}`;
        }
        throw new Error(errorMsg);
      }

      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const json = JSON.parse(text);

      setSnackbar({
        open: true,
        message: `예측 번호 저장됨: ${nums.join(', ')}`,
        severity: 'success',
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: `저장 실패: ${String(e)}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row">
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? '저장 중...' : '번호 추출'}
        </Button>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
