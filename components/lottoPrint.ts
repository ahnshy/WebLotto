'use client';

import type { DrawRow } from '@/app/actions';

const SLIP_WIDTH_MM = 182;
const SLIP_HEIGHT_MM = 80;
const MM_TO_PX = 96 / 25.4;
const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse)';

function centerPopup(width: number, height: number) {
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));

  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

export function printLottoSlip(draws: DrawRow[]) {
  const selected = draws.slice(0, 5).map((draw) => draw.numbers);
  const encoded = encodeURIComponent(JSON.stringify(selected));
  const usePortrait = window.matchMedia(MOBILE_QUERY).matches;
  const url = `${window.location.origin}/print/lotto?data=${encoded}${usePortrait ? '&layout=portrait' : ''}`;
  const previewWidthMm = usePortrait ? SLIP_HEIGHT_MM : SLIP_WIDTH_MM;
  const previewHeightMm = usePortrait ? SLIP_WIDTH_MM : SLIP_HEIGHT_MM;
  const popupWidth = Math.round(previewWidthMm * MM_TO_PX) + 120;
  const popupHeight = Math.round(previewHeightMm * MM_TO_PX) + 180;
  const popup = window.open(url, 'lotto-print-preview', centerPopup(popupWidth, popupHeight));

  if (!popup) {
    throw new Error('Print popup is blocked. Allow popups for this site and try again.');
  }

  popup.focus();
}
