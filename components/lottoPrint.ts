'use client';

import type { DrawRow } from '@/app/actions';

const SLIP_WIDTH_MM = 182;
const SLIP_HEIGHT_MM = 80;
const MM_TO_PX = 96 / 25.4;

function centerPopup(width: number, height: number) {
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));

  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

export function printLottoSlip(draws: DrawRow[]) {
  const selected = draws.slice(0, 5).map((draw) => draw.numbers);
  const encoded = encodeURIComponent(JSON.stringify(selected));
  const url = `${window.location.origin}/print/lotto?data=${encoded}`;
  const popupWidth = Math.round(SLIP_WIDTH_MM * MM_TO_PX) + 120;
  const popupHeight = Math.round(SLIP_HEIGHT_MM * MM_TO_PX) + 180;
  const popup = window.open('', 'lotto-print-preview', centerPopup(popupWidth, popupHeight));

  if (!popup) {
    throw new Error('출력 팝업을 열 수 없습니다. 브라우저 팝업 차단 설정을 확인해 주세요.');
  }

  popup.document.write(`
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>로또 출력 미리보기</title>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f4f1e8;
            color: #2a2721;
          }
          body {
            display: grid;
            place-items: center;
          }
          .message {
            display: grid;
            gap: 10px;
            place-items: center;
            text-align: center;
          }
          .spinner {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 4px solid rgba(42,39,33,.16);
            border-top-color: #2a2721;
            animation: spin .9s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="message">
          <div class="spinner"></div>
          <div>로또 용지 미리보기를 준비하는 중입니다...</div>
        </div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.location.replace(url);
  popup.focus();
}
