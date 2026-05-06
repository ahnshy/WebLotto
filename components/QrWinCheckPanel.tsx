'use client';

import * as React from 'react';
import jsQR from 'jsqr';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useLocale } from 'next-intl';
import NumberBall from './NumberBall';

type QrGameResult = {
  index: number;
  numbers: number[];
  matchedNumbers: number[];
  matchedCount: number;
  bonusMatched: boolean;
  prizeRank: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'No win';
  winStatus: 'win' | 'loss';
};

type QrCheckResult = {
  round: number;
  drawDate: string;
  winNumbers: number[];
  bonusNumber: number;
  games: QrGameResult[];
  totalGames: number;
  winningGames: number;
};

function rankLabel(rank: QrGameResult['prizeRank'], isEn: boolean) {
  if (isEn) return rank;
  return rank === 'No win' ? '낙첨' : `${rank.replace(/[a-z]/g, '')}등`;
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available.');
  return context;
}

async function decodeImageFile(file: File, canvas: HTMLCanvasElement) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = getCanvasContext(canvas);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height)?.data ?? null;
}

export default function QrWinCheckPanel() {
  const isEn = useLocale() === 'en';
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const checkingRef = React.useRef(false);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(isEn ? 'Scan the lotto QR code.' : '로또 QR을 스캔하세요.');
  const [error, setError] = React.useState<string | null>(null);
  const [qrText, setQrText] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<QrCheckResult | null>(null);

  const stopCamera = React.useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const checkQr = React.useCallback(async (text: string) => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setLoading(true);
    setError(null);
    setQrText(text);
    setMessage(isEn ? 'Checking winning status.' : '당첨 여부를 확인하는 중입니다.');

    try {
      const response = await fetch('/api/lotto-qr/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrText: text }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.error || `HTTP ${response.status}`);
      setResult(json as QrCheckResult);
      setMessage(isEn ? 'Winning status checked.' : '당첨 확인이 완료되었습니다.');
    } catch (scanError) {
      setError(String(scanError));
      setResult(null);
      setMessage(isEn ? 'Failed to check the QR code.' : 'QR 당첨 확인에 실패했습니다.');
    } finally {
      setLoading(false);
      checkingRef.current = false;
    }
  }, [isEn]);

  const scanVideoFrame = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = getCanvasContext(canvas);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code?.data) {
      stopCamera();
      void checkQr(code.data);
      return;
    }

    frameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [checkQr, stopCamera]);

  const startCamera = async () => {
    setError(null);
    setResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(isEn ? 'Camera is not available in this browser. Upload an image file instead.' : '이 브라우저에서는 카메라를 사용할 수 없습니다. 이미지 파일을 올려주세요.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setMessage(isEn ? 'Point the camera at the lotto QR code.' : '카메라를 로또 QR 코드에 맞춰주세요.');
      frameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (cameraError) {
      setError(isEn ? `Camera failed: ${String(cameraError)}. Upload an image file instead.` : `카메라 실행 실패: ${String(cameraError)}. 이미지 파일을 올려주세요.`);
      stopCamera();
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canvasRef.current) return;

    setLoading(true);
    setError(null);
    setResult(null);
    stopCamera();

    try {
      const decoded = await decodeImageFile(file, canvasRef.current);
      if (!decoded) throw new Error(isEn ? 'QR code was not found in the image.' : '이미지에서 QR 코드를 찾지 못했습니다.');
      await checkQr(decoded);
    } catch (fileError) {
      setError(String(fileError));
      setMessage(isEn ? 'Failed to read the uploaded image.' : '업로드한 이미지 인식에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => stopCamera, [stopCamera]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <QrCodeScannerIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {isEn ? 'QR Winning Check' : 'QR 당첨 확인'}
        </Typography>
      </Stack>

      <Alert severity={error ? 'error' : result ? 'success' : 'info'} icon={loading ? <CircularProgress size={20} /> : undefined}>
        {error ?? message}
      </Alert>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 1,
          bgcolor: 'action.hover',
          aspectRatio: { xs: '4 / 3', md: '16 / 9' },
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          muted
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none',
          }}
        />
        {!cameraActive && (
          <Stack spacing={1} alignItems="center" sx={{ px: 2, textAlign: 'center' }}>
            <QrCodeScannerIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {isEn ? 'Use the camera or upload a lotto slip image.' : '카메라로 스캔하거나 로또 용지 이미지를 업로드하세요.'}
            </Typography>
          </Stack>
        )}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="contained" startIcon={<CameraAltIcon />} onClick={() => void startCamera()} disabled={cameraActive || loading}>
          {isEn ? 'Scan with Camera' : '카메라 QR 스캔'}
        </Button>
        <Button variant="outlined" color="inherit" startIcon={<StopCircleIcon />} onClick={stopCamera} disabled={!cameraActive}>
          {isEn ? 'Stop Camera' : '카메라 중지'}
        </Button>
        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={loading}>
          {isEn ? 'Upload Scan File' : '스캔파일 올리기'}
          <input hidden type="file" accept="image/*" onChange={(event) => void handleFile(event)} />
        </Button>
      </Stack>

      <canvas ref={canvasRef} hidden />

      {qrText && (
        <Paper variant="outlined" sx={{ p: 1.25, overflowWrap: 'anywhere' }}>
          <Typography variant="caption" color="text.secondary">
            {isEn ? 'Scanned QR' : '인식된 QR'}
          </Typography>
          <Typography variant="body2">{qrText}</Typography>
        </Paper>
      )}

      {result && (
        <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 } }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {isEn ? `Round ${result.round}` : `${result.round}회차`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.drawDate} · {isEn ? `${result.winningGames}/${result.totalGames} winning games` : `당첨 ${result.winningGames}/${result.totalGames} 게임`}
                </Typography>
              </Box>
              <Chip color={result.winningGames > 0 ? 'success' : 'default'} label={result.winningGames > 0 ? (isEn ? 'Win' : '당첨') : (isEn ? 'No win' : '낙첨')} />
            </Stack>

            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }} alignItems="center">
              {result.winNumbers.map((number) => <NumberBall key={number} n={number} size={30} mr={0} />)}
              <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>+</Typography>
              <NumberBall n={result.bonusNumber} size={30} mr={0} />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              {result.games.map((game) => (
                <Paper key={game.index} variant="outlined" sx={{ p: 1.25, bgcolor: game.winStatus === 'win' ? 'success.light' : 'background.paper' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {isEn ? `Game ${game.index}` : `${game.index}게임`}
                      </Typography>
                      <Chip size="small" color={game.winStatus === 'win' ? 'success' : 'default'} label={rankLabel(game.prizeRank, isEn)} />
                    </Stack>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {game.numbers.map((number) => <NumberBall key={`${game.index}-${number}`} n={number} size={28} mr={0} />)}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {isEn ? `Matched ${game.matchedCount}${game.bonusMatched ? ', bonus matched' : ''}` : `일치 ${game.matchedCount}개${game.bonusMatched ? ', 보너스 일치' : ''}`}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
