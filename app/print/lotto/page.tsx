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
        bottom: '1.2mm',
        height: '4.8mm',
        display: 'grid',
        gridTemplateColumns: 'repeat(38, 1fr)',
        gap: '0.9mm',
        alignItems: 'end',
      }}
    >
      {Array.from({ length: 38 }).map((_, index) => (
        <Box
          key={`bottom-${index}`}
          sx={{
            height: index % 2 === 0 ? '4.8mm' : '3mm',
            bgcolor: '#111',
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
        top: '2mm',
        right: '1.6mm',
        bottom: '6.6mm',
        width: '4.8mm',
        display: 'grid',
        gridTemplateRows: '2.5mm repeat(12, 1fr) 2.5mm',
        justifyItems: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: '2.2mm', height: '2.2mm', bgcolor: '#111' }} />
      {Array.from({ length: 12 }).map((_, index) => (
        <Box key={`right-${index}`} sx={{ width: '2.2mm', height: '4.1mm', bgcolor: '#111' }} />
      ))}
      <Box sx={{ width: '2.2mm', height: '2.2mm', bgcolor: '#111' }} />
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
          }}
        >
          Lotto 6/45
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

function NumberBubble({ number, active }: { number: number; active: boolean }) {
  return (
    <Box
      sx={{
        width: '3.4mm',
        height: '3.8mm',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '0.15mm',
          borderRadius: '999px',
          border: '0.18mm solid #ba8d86',
          bgcolor: active ? '#2f2a28' : '#fff',
        }}
      />
      <Typography
        component="span"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: active ? '#fff' : '#9c6762',
          fontSize: '1.7mm',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {number}
      </Typography>
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
        gridTemplateRows: '5.8mm 1fr 9mm',
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

      <Box sx={{ px: '0.75mm', pt: '0.7mm', pb: '0.5mm', display: 'grid', gap: '0.6mm', alignContent: 'start' }}>
        {NUMBER_ROWS.map((row, rowIndex) => (
          <Box
            key={`${label}-${rowIndex}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${row.length}, 3.4mm)`,
              gap: '0.45mm',
              justifyContent: 'flex-start',
            }}
          >
            {row.map((number) => (
              <NumberBubble key={`${label}-${number}`} number={number} active={selected.has(number)} />
            ))}
          </Box>
        ))}
      </Box>

      <Box sx={{ px: '0.9mm', pt: '0.6mm', pb: '0.7mm', display: 'grid', alignContent: 'space-between' }}>
        <Typography sx={{ color: '#bf746d', fontSize: '1.8mm', fontWeight: 700, lineHeight: 1.2 }}>
          자동 / 반자동 선택
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2.4mm', alignItems: 'center' }}>
          <Box sx={{ borderBottom: '0.16mm solid #dcc8c2', height: '1px' }} />
          <Box sx={{ justifySelf: 'end', width: '1.8mm', height: '1.8mm', border: '0.18mm solid #bf8f89' }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2.4mm', alignItems: 'center' }}>
          <Typography sx={{ justifySelf: 'end', color: '#bf746d', fontSize: '1.9mm', fontWeight: 700, lineHeight: 1 }}>
            취소
          </Typography>
          <Box sx={{ justifySelf: 'end', width: '1.8mm', height: '1.8mm', border: '0.18mm solid #bf8f89' }} />
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
          fontSize: '1.7mm',
          lineHeight: 1.45,
          textAlign: 'center',
        }}
      >
        실제 출력 시 배율 100%를 사용하고 여백 없이 인쇄하세요.
      </Typography>
    </Box>
  );
}

export default async function LottoPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string | string[]; layout?: string | string[] }>;
}) {
  const params = await searchParams;
  const picks = parseData(params.data);
  const layout = Array.isArray(params.layout) ? params.layout[0] : params.layout;
  const isPortrait = layout === 'portrait';
  const pageWidthMm = isPortrait ? SLIP_HEIGHT_MM : SLIP_WIDTH_MM;
  const pageHeightMm = isPortrait ? SLIP_WIDTH_MM : SLIP_HEIGHT_MM;

  return (
    <>
      <AutoPrint />
      <style>{`
        @page {
          size: ${pageWidthMm}mm ${pageHeightMm}mm ${isPortrait ? 'portrait' : 'landscape'};
          margin: 0;
        }
        html, body {
          width: ${pageWidthMm}mm;
          height: ${pageHeightMm}mm;
          margin: 0;
          padding: 0;
          background: #f3efe8;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media screen {
          body {
            min-width: ${pageWidthMm}mm;
            min-height: ${pageHeightMm}mm;
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
          width: `${pageWidthMm}mm`,
          height: `${pageHeightMm}mm`,
          display: 'grid',
          placeItems: 'stretch',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: `${SLIP_WIDTH_MM}mm`,
            height: `${SLIP_HEIGHT_MM}mm`,
            justifySelf: 'center',
            alignSelf: 'center',
            transform: isPortrait ? 'rotate(90deg)' : 'none',
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
              gap: '1.6mm',
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
