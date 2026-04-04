import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import AutoPrint from './AutoPrint';

const SLIP_WIDTH_MM = 182;
const SLIP_HEIGHT_MM = 80;
const PLAY_LABELS = ['A', 'B', 'C', 'D', 'E'];
const NUMBER_ROWS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, 32, 33, 34, 35],
  [36, 37, 38, 39, 40, 41, 42],
  [43, 44, 45],
];

function parseData(raw: string | string[] | undefined): number[][] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];

  try {
    const decoded = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(decoded)) return [];

    return decoded
      .map((item) => (Array.isArray(item) ? item : []))
      .map((item) =>
        item
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 45)
          .slice(0, 6)
          .sort((a, b) => a - b)
      )
      .filter((item) => item.length === 6)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function OmrBottom() {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '34mm',
        right: '8.5mm',
        bottom: '1.4mm',
        height: '4.3mm',
        display: 'grid',
        gridTemplateColumns: 'repeat(38, 1fr)',
        gap: '1mm',
        alignItems: 'end',
      }}
    >
      {Array.from({ length: 38 }).map((_, index) => (
        <Box
          key={`bottom-${index}`}
          sx={{
            height: index % 2 === 0 ? '4.3mm' : '2.7mm',
            bgcolor: '#222',
          }}
        />
      ))}
    </Box>
  );
}

function OmrRight() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '2.1mm',
        right: '1.7mm',
        bottom: '6.6mm',
        width: '4.6mm',
        display: 'grid',
        gridTemplateRows: '3mm repeat(12, 1fr) 3mm',
        justifyItems: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: '2mm', height: '2mm', bgcolor: '#222' }} />
      {Array.from({ length: 12 }).map((_, index) => (
        <Box key={`right-${index}`} sx={{ width: '2mm', height: '4mm', bgcolor: '#222' }} />
      ))}
      <Box sx={{ width: '2mm', height: '2mm', bgcolor: '#222' }} />
    </Box>
  );
}

function LeftBrandPanel() {
  return (
    <Box
      sx={{
        height: '100%',
        borderRight: '0.22mm solid #d4bfb8',
        pr: '2.3mm',
        pb: '6.4mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack spacing="1mm" alignItems="center">
        <Typography
          sx={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: '#d86158',
            fontWeight: 900,
            fontSize: '6.3mm',
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          Lotto6/45
        </Typography>
        <Typography
          sx={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: '#c36159',
            fontWeight: 800,
            fontSize: '3.9mm',
            lineHeight: 1,
          }}
        >
          동행복권
        </Typography>
      </Stack>
    </Box>
  );
}

function NumberBox({ number, active }: { number: number; active: boolean }) {
  return (
    <Box
      sx={{
        width: '3.1mm',
        height: '3.7mm',
        border: '0.18mm solid #bf8f89',
        bgcolor: active ? '#dc645c' : '#fff',
        color: active ? '#fff' : '#9c6762',
        display: 'grid',
        placeItems: 'center',
        fontSize: '1.88mm',
        fontWeight: active ? 800 : 600,
        lineHeight: 1,
      }}
    >
      {number}
    </Box>
  );
}

function PickColumn({ label, picked }: { label: string; picked: number[] | undefined }) {
  const selected = new Set(picked ?? []);

  return (
    <Box
      sx={{
        height: '100%',
        border: '0.2mm solid #d6bbb4',
        display: 'grid',
        gridTemplateRows: '5.8mm 1fr 8.6mm',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '4mm 1fr',
          borderBottom: '0.2mm solid #d6bbb4',
          bgcolor: '#ea7b6f',
          color: '#fff',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            fontSize: '3.4mm',
            borderRight: '0.2mm solid rgba(255,255,255,0.7)',
          }}
        >
          {label}
        </Box>
        <Box sx={{ display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '2.95mm' }}>
          1,000원
        </Box>
      </Box>

      <Box sx={{ px: '0.85mm', pt: '0.8mm', pb: '0.5mm', display: 'grid', gap: '0.75mm', alignContent: 'start' }}>
        {NUMBER_ROWS.map((row, rowIndex) => (
          <Box
            key={`${label}-${rowIndex}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${row.length}, 3.1mm)`,
              gap: '0.66mm',
              justifyContent: 'flex-start',
            }}
          >
            {row.map((number) => (
              <NumberBox key={`${label}-${number}`} number={number} active={selected.has(number)} />
            ))}
          </Box>
        ))}
      </Box>

      <Box sx={{ px: '0.9mm', pt: '0.6mm', pb: '0.7mm', display: 'grid', alignContent: 'space-between' }}>
        <Typography sx={{ color: '#bf746d', fontSize: '1.95mm', fontWeight: 700, lineHeight: 1.2 }}>
          자동 및 반자동 선택
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2.3mm', alignItems: 'center' }}>
          <Box sx={{ borderBottom: '0.16mm solid #dcc8c2', height: '1px' }} />
          <Box sx={{ justifySelf: 'end', width: '1.7mm', height: '1.7mm', border: '0.18mm solid #bf8f89' }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2.3mm', alignItems: 'center' }}>
          <Typography sx={{ justifySelf: 'end', color: '#bf746d', fontSize: '2.05mm', fontWeight: 700, lineHeight: 1 }}>
            취소
          </Typography>
          <Box sx={{ justifySelf: 'end', width: '1.7mm', height: '1.7mm', border: '0.18mm solid #bf8f89' }} />
        </Box>
      </Box>
    </Box>
  );
}

function RightInfoPanel() {
  return (
    <Box
      sx={{
        height: '100%',
        pl: '0.8mm',
        pr: '0.4mm',
        pb: '6.8mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          color: '#6c6258',
          fontSize: '1.72mm',
          lineHeight: 1.45,
          textAlign: 'center',
        }}
      >
        100% 배율로 시험 인쇄 후 정렬 상태를 확인하세요.
      </Typography>
    </Box>
  );
}

export default async function LottoPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string | string[] }>;
}) {
  const params = await searchParams;
  const picks = parseData(params.data);

  return (
    <>
      <AutoPrint />
      <style>{`
        @page {
          size: ${SLIP_WIDTH_MM}mm ${SLIP_HEIGHT_MM}mm landscape;
          margin: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #f3efe8;
          overflow: hidden;
        }
        * {
          box-sizing: border-box;
        }
        @media screen {
          body {
            min-height: 100vh;
          }
        }
        @media print {
          html, body {
            background: #fff;
          }
        }
      `}</style>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          p: 0,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: `${SLIP_WIDTH_MM}mm`,
            height: `${SLIP_HEIGHT_MM}mm`,
            bgcolor: '#fffdfa',
            color: '#2d2522',
            border: '0.24mm solid #d5c8c0',
            px: '2mm',
            pt: '1.7mm',
            pb: '5.2mm',
            overflow: 'hidden',
            boxShadow: '0 18px 40px rgba(0,0,0,0.14)',
            '@media print': {
              boxShadow: 'none',
            },
          }}
        >
          <OmrRight />
          <OmrBottom />

          <Box
            sx={{
              height: '100%',
              display: 'grid',
              gridTemplateColumns: '27mm repeat(5, minmax(0, 1fr)) 6mm',
              gap: '1.8mm',
              alignItems: 'stretch',
            }}
          >
            <LeftBrandPanel />
            {PLAY_LABELS.map((label, index) => (
              <PickColumn key={label} label={label} picked={picks[index]} />
            ))}
            <RightInfoPanel />
          </Box>
        </Box>
      </Box>
    </>
  );
}
