'use client';

import * as React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import NumberBall from './NumberBall';

type BallPhase = 'bowl' | 'travel' | 'result';
type Point = { x: number; y: number };

type SimBall = {
  id: number;
  number: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: BallPhase;
  route?: Point[];
  routeIndex?: number;
  resultIndex?: number;
};

const WORLD_W = 840;
const WORLD_H = 620;
const BOWL = { cx: 315, cy: 280, r: 208 };
const BALL_R = 12;
const GRAVITY = 0.08;
const LIFT_X = 320;
const LIFT_BOTTOM_Y = 486;
const LIFT_TOP_Y = 120;
const RAIL_CENTER = { x: 548, y: 246 };
const RAIL_RX = 150;
const RAIL_RY = 204;
const EXIT_X = 690;
const RESULT_Y = 548;
const RESULT_SLOTS = [42, 92, 142, 192, 242, 292].map((x) => ({ x, y: RESULT_Y }));
const COLORS = ['#ef5350', '#ffa726', '#42a5f5', '#66bb6a', '#ab47bc', '#26c6da'];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeNumbers() {
  return shuffle(Array.from({ length: 45 }, (_, index) => index + 1));
}

function createBalls(numbers?: number[]) {
  const pool = numbers ?? makeNumbers();

  return pool.map((number, index) => {
    const angle = (Math.PI * 2 * index) / 45;
    const radius = randomBetween(16, BOWL.r - BALL_R - 18);
    return {
      id: index,
      number,
      color: COLORS[index % COLORS.length],
      x: BOWL.cx + Math.cos(angle) * radius,
      y: BOWL.cy + Math.sin(angle) * radius * 0.9,
      vx: randomBetween(-1.15, 1.15),
      vy: randomBetween(-0.85, 0.85),
      r: BALL_R,
      phase: 'bowl' as BallPhase,
    };
  });
}

function buildTravelRoute(resultIndex: number): Point[] {
  const route: Point[] = [];

  for (let step = 0; step < 18; step += 1) {
    const t = step / 17;
    route.push({
      x: LIFT_X,
      y: LIFT_BOTTOM_Y + (LIFT_TOP_Y - LIFT_BOTTOM_Y) * t,
    });
  }

  for (let step = 1; step <= 18; step += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 0.9 * step) / 18;
    route.push({
      x: RAIL_CENTER.x + Math.cos(angle) * RAIL_RX,
      y: RAIL_CENTER.y + Math.sin(angle) * RAIL_RY,
    });
  }

  route.push({ x: EXIT_X, y: 458 });
  route.push(RESULT_SLOTS[resultIndex]);
  return route;
}

function ballSx(ball: SimBall) {
  return {
    position: 'absolute' as const,
    left: `${(ball.x / WORLD_W) * 100}%`,
    top: `${(ball.y / WORLD_H) * 100}%`,
    width: `${((ball.r * 2) / WORLD_W) * 100}%`,
    aspectRatio: '1 / 1',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.98), rgba(255,255,255,0.42) 24%, ${ball.color} 28%, ${ball.color} 64%, rgba(0,0,0,0.18) 100%)`,
    boxShadow: '0 6px 12px rgba(0,0,0,0.18), inset -2px -3px 6px rgba(0,0,0,0.12), inset 3px 3px 7px rgba(255,255,255,0.4)',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontWeight: 900,
    fontSize: { xs: '0.42rem', sm: '0.52rem' },
    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
    zIndex: ball.phase === 'bowl' ? 3 : 6,
  };
}

export default function MockDrawPanel() {
  const [balls, setBalls] = React.useState<SimBall[]>(() => createBalls());
  const [drawnNumbers, setDrawnNumbers] = React.useState<number[]>([]);
  const [running, setRunning] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const resetSimulation = React.useCallback(() => {
    clearTimers();
    setRunning(false);
    setDrawnNumbers([]);
    setBalls(createBalls());
  }, [clearTimers]);

  React.useEffect(() => {
    let last = performance.now();

    const loop = (now: number) => {
      const delta = Math.min(1.4, (now - last) / 16.6667);
      last = now;

      setBalls((prev) => {
        const next: SimBall[] = prev.map((ball) => {
          if (ball.phase === 'result' && ball.resultIndex != null) {
            return {
              ...ball,
              x: RESULT_SLOTS[ball.resultIndex].x,
              y: RESULT_SLOTS[ball.resultIndex].y,
              vx: 0,
              vy: 0,
            };
          }

          if (ball.phase === 'travel' && ball.route && ball.routeIndex != null) {
            const target = ball.route[ball.routeIndex];
            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const distance = Math.hypot(dx, dy) || 1;
            const speed = 13.5 * delta;

            if (distance <= speed) {
              const nextIndex = ball.routeIndex + 1;
              if (nextIndex >= ball.route.length) {
                return {
                  ...ball,
                  x: target.x,
                  y: target.y,
                  vx: 0,
                  vy: 0,
                  phase: 'result',
                };
              }

              return {
                ...ball,
                x: target.x,
                y: target.y,
                vx: 0,
                vy: 0,
                routeIndex: nextIndex,
              };
            }

            return {
              ...ball,
              x: ball.x + (dx / distance) * speed,
              y: ball.y + (dy / distance) * speed,
              vx: 0,
              vy: 0,
            };
          }

          const swirlX = running ? Math.cos(now / 110 + ball.id) * 0.2 : Math.cos(now / 240 + ball.id) * 0.03;
          const swirlY = running ? Math.sin(now / 122 + ball.id) * 0.15 : Math.sin(now / 240 + ball.id) * 0.02;
          let vx = ball.vx + swirlX * delta;
          let vy = ball.vy + (GRAVITY + swirlY) * delta;
          let x = ball.x + vx * delta;
          let y = ball.y + vy * delta;

          const dx = x - BOWL.cx;
          const dy = y - BOWL.cy;
          const distance = Math.hypot(dx, dy) || 1;
          const maxDistance = BOWL.r - ball.r - 6;

          if (distance > maxDistance) {
            const nx = dx / distance;
            const ny = dy / distance;
            x = BOWL.cx + nx * maxDistance;
            y = BOWL.cy + ny * maxDistance;
            const normal = vx * nx + vy * ny;
            vx -= 1.9 * normal * nx;
            vy -= 1.9 * normal * ny;
          }

          vx *= running ? 0.995 : 0.988;
          vy *= running ? 0.995 : 0.988;

          return { ...ball, x, y, vx, vy };
        });

        for (let i = 0; i < next.length; i += 1) {
          for (let j = i + 1; j < next.length; j += 1) {
            const a = next[i];
            const b = next[j];
            if (a.phase !== 'bowl' || b.phase !== 'bowl') continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 1;
            const minDistance = a.r + b.r - 0.4;

            if (distance < minDistance) {
              const nx = dx / distance;
              const ny = dy / distance;
              const overlap = minDistance - distance;
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;

              const dvx = b.vx - a.vx;
              const dvy = b.vy - a.vy;
              const impulse = dvx * nx + dvy * ny;
              if (impulse < 0) {
                const bounce = -impulse * 0.92;
                a.vx -= nx * bounce;
                a.vy -= ny * bounce;
                b.vx += nx * bounce;
                b.vy += ny * bounce;
              }
            }
          }
        }

        return [...next];
      });

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimers();
    };
  }, [clearTimers, running]);

  const startDraw = React.useCallback(() => {
    if (running) return;

    clearTimers();
    const numbers = makeNumbers();
    const winners = numbers.slice(0, 6);

    setBalls(createBalls(numbers));
    setDrawnNumbers([]);
    setRunning(true);

    const warmup = window.setTimeout(() => {
      winners.forEach((winner, index) => {
        const timer = window.setTimeout(() => {
          setBalls((prev) => {
            let consumed = false;
            let fallbackIndex = prev.findIndex((ball) => ball.phase === 'bowl');

            return prev.map((ball, ballIndex): SimBall => {
              if (!consumed && ball.number === winner && ball.phase === 'bowl') {
                consumed = true;
                return {
                  ...ball,
                  phase: 'travel',
                  route: buildTravelRoute(index),
                  routeIndex: 0,
                  resultIndex: index,
                  vx: 0,
                  vy: 0,
                };
              }

              if (!consumed && ballIndex === fallbackIndex && ball.phase === 'bowl') {
                consumed = true;
                return {
                  ...ball,
                  phase: 'travel',
                  route: buildTravelRoute(index),
                  routeIndex: 0,
                  resultIndex: index,
                  vx: 0,
                  vy: 0,
                };
              }
              return ball;
            });
          });
          setDrawnNumbers((prev) => [...prev, winner]);

          if (index === winners.length - 1) {
            const finish = window.setTimeout(() => setRunning(false), 1600);
            timersRef.current.push(finish);
          }
        }, index * 650);
        timersRef.current.push(timer);
      });
    }, 450);

    timersRef.current.push(warmup);
  }, [clearTimers, running]);

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: 'hidden',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(13,18,31,0.98), rgba(10,14,24,0.94))'
          : 'linear-gradient(180deg, #ffffff, #f6f7fb)',
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              모의추첨
            </Typography>
            <Typography variant="body2" color="text.secondary">
              고정된 추첨기 시안 위에서 공만 움직이도록 다시 구성했고, 공 6개가 순차적으로 확실히 추첨되도록 구현했습니다.
            </Typography>
          </Stack>

          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: `${WORLD_W} / ${WORLD_H}`,
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(180deg, #ffffff, #f7f8fb)',
              border: '1px solid rgba(160,168,182,0.16)',
            }}
          >
            <svg
              viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
            >
              <defs>
                <linearGradient id="railStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#969fb1" />
                  <stop offset="100%" stopColor="#bcc4d1" />
                </linearGradient>
                <linearGradient id="liftGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7ec5b" />
                  <stop offset="100%" stopColor="#ff784b" />
                </linearGradient>
              </defs>

              <path
                d="M 28 500 C 110 500, 210 500, 370 500"
                fill="none"
                stroke="url(#railStroke)"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 28 500 C 110 500, 210 500, 370 500"
                fill="none"
                stroke="rgba(245,247,250,0.96)"
                strokeWidth="9"
                strokeLinecap="round"
              />

              <path
                d="M 370 500 C 382 452, 394 414, 406 352 C 448 202, 604 76, 724 106 C 790 130, 816 236, 806 320 C 800 378, 790 422, 784 458"
                fill="none"
                stroke="url(#railStroke)"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 370 500 C 382 452, 394 414, 406 352 C 448 202, 604 76, 724 106 C 790 130, 816 236, 806 320 C 800 378, 790 422, 784 458"
                fill="none"
                stroke="rgba(245,247,250,0.96)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {[0, 1, 2, 3, 4, 5].map((index) => (
                <ellipse
                  key={`ring-${index}`}
                  cx={646 + index * 22}
                  cy={120 + index * 56}
                  rx="18"
                  ry="12"
                  fill="rgba(255,255,255,0.34)"
                  stroke="#98a1b2"
                  strokeWidth="4"
                  transform={`rotate(30 ${646 + index * 22} ${120 + index * 56})`}
                />
              ))}

              <circle cx={BOWL.cx} cy={BOWL.cy} r={BOWL.r} fill="rgba(191,230,255,0.38)" stroke="#d1d8e3" strokeWidth="6" />
              <ellipse cx={BOWL.cx - 42} cy={BOWL.cy - 96} rx="126" ry="74" fill="rgba(255,255,255,0.28)" />
              <rect x={LIFT_X - 14} y={LIFT_TOP_Y} width="28" height={LIFT_BOTTOM_Y - LIFT_TOP_Y} rx="14" fill="url(#liftGlow)" opacity="0.95" />
              <ellipse cx={LIFT_X} cy={LIFT_BOTTOM_Y + 12} rx="76" ry="26" fill="#6a6f79" opacity="0.98" />
              <ellipse cx={LIFT_X} cy={LIFT_BOTTOM_Y + 18} rx="58" ry="16" fill="#4e525b" opacity="0.96" />
            </svg>

            {balls.map((ball) => (
              <Box key={ball.id} sx={ballSx(ball)}>
                {ball.number}
              </Box>
            ))}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" alignItems="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={startDraw}
              disabled={running}
              sx={{
                minWidth: { xs: 160, sm: 178 },
                borderRadius: 999,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f25f5c, #ff8f3d)',
                boxShadow: '0 10px 22px rgba(242,95,92,0.32)',
              }}
            >
              {running ? '추첨 중...' : '추첨 시작'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<RestartAltRoundedIcon />}
              onClick={resetSimulation}
              disabled={running}
              sx={{
                minWidth: { xs: 140, sm: 152 },
                borderRadius: 999,
                fontWeight: 800,
              }}
            >
              초기화
            </Button>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              추첨 결과
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              {drawnNumbers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  아직 추첨된 공이 없습니다.
                </Typography>
              ) : (
                drawnNumbers.map((number) => (
                  <NumberBall key={`mock-${number}`} n={number} size={34} mr={0} />
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
