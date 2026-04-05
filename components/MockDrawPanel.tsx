
"use client";

import * as React from "react";
import {
  AutorenewRounded,
  PlayArrowRounded,
  RestartAltRounded,
  SlowMotionVideoRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import NumberBall from "./NumberBall";

type BallState = "drum" | "ejecting" | "winner";

type Point = {
  x: number;
  y: number;
};

type PathMetrics = {
  points: Point[];
  segmentLengths: number[];
  totalLength: number;
};

type Ball = {
  id: number;
  label: number;
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: BallState;
  winnerIndex: number | null;
};

type MachineLayout = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  drumRadius: number;
  railCenterX: number;
  railCenterY: number;
  railRadiusOuter: number;
  railRadiusInner: number;
  trayX: number;
  trayY: number;
  trayWidth: number;
  outletX: number;
  outletY: number;
  ballRadius: number;
  winnerBaseX: number;
  winnerGap: number;
  winnerY: number;
  winnerStartY: number;
  winnerSlotRadius: number;
  machineFootX: number;
  machineFootY: number;
};

type ActiveEjection = {
  ballId: number;
  winnerIndex: number;
  startedAt: number;
  duration: number;
  path: PathMetrics;
};

type MachinePhase = "idle" | "mixing" | "drawing" | "complete";

type MachineRuntime = {
  running: boolean;
  phase: MachinePhase;
  drumAngle: number;
  nextDrawAt: number;
  activeEjection: ActiveEjection | null;
};

type DrawHistoryEntry = {
  round: number;
  numbers: number[];
};

const TOTAL_BALLS = 45;
const DRAW_COUNT = 6;
const FRAME_DURATION = 1000 / 60;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixHex(hex: string, ratio: number, target: "#ffffff" | "#000000") {
  const rgb = hexToRgb(hex);
  const base = target === "#ffffff" ? 255 : 0;
  const next = {
    r: Math.round(rgb.r + (base - rgb.r) * ratio),
    g: Math.round(rgb.g + (base - rgb.g) * ratio),
    b: Math.round(rgb.b + (base - rgb.b) * ratio),
  };
  return `rgb(${next.r}, ${next.g}, ${next.b})`;
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLottoColor(label: number) {
  if (label <= 10) return "#fbbf24";
  if (label <= 20) return "#3b82f6";
  if (label <= 30) return "#ef4444";
  if (label <= 40) return "#94a3b8";
  return "#22c55e";
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getMachineLayout(width: number): MachineLayout {
  const safeWidth = clamp(width, 320, 980);
  const height = Math.round(safeWidth * 0.78);
  const centerX = safeWidth * 0.4;
  const centerY = height * 0.38;
  const drumRadius = safeWidth * 0.23;
  const ballRadius = clamp(safeWidth * 0.021, 11, 18);
  const railCenterX = centerX + drumRadius * 0.92;
  const railCenterY = centerY + drumRadius * 0.01;
  const railRadiusOuter = drumRadius * 0.88;
  const railRadiusInner = railRadiusOuter - clamp(safeWidth * 0.028, 12, 26);
  const winnerGap = ballRadius * 2.16;
  const trayWidth = Math.max(ballRadius * 14.8, safeWidth * 0.36);
  const trayX = centerX - trayWidth / 2;
  const winnerBaseX = centerX - (winnerGap * (DRAW_COUNT - 1)) / 2;
  const winnerY = centerY + drumRadius + ballRadius * 1.78;
  const winnerStartY = winnerY - ballRadius * 1.35;
  const trayY = winnerY + ballRadius * 0.28;
  const outletX = centerX + drumRadius * 0.74;
  const outletY = centerY - drumRadius * 0.82;
  const winnerSlotRadius = ballRadius * 1.15;
  const machineFootX = centerX - drumRadius * 0.17;
  const machineFootY = centerY + drumRadius * 0.95;

  return {
    width: safeWidth,
    height,
    centerX,
    centerY,
    drumRadius,
    railCenterX,
    railCenterY,
    railRadiusOuter,
    railRadiusInner,
    trayX,
    trayY,
    trayWidth,
    outletX,
    outletY,
    ballRadius,
    winnerBaseX,
    winnerGap,
    winnerY,
    winnerStartY,
    winnerSlotRadius,
    machineFootX,
    machineFootY,
  };
}

function buildPathMetrics(points: Point[]): PathMetrics {
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segmentLengths.push(length);
    totalLength += length;
  }

  return { points, segmentLengths, totalLength };
}

function samplePath(path: PathMetrics, progress: number) {
  if (path.points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (path.points.length === 1 || path.totalLength === 0) {
    return path.points[path.points.length - 1];
  }

  const targetDistance = path.totalLength * clamp(progress, 0, 1);
  let walked = 0;

  for (let index = 0; index < path.segmentLengths.length; index += 1) {
    const segmentLength = path.segmentLengths[index];
    if (walked + segmentLength >= targetDistance) {
      const local = segmentLength === 0 ? 0 : (targetDistance - walked) / segmentLength;
      const start = path.points[index];
      const end = path.points[index + 1];
      return {
        x: start.x + (end.x - start.x) * local,
        y: start.y + (end.y - start.y) * local,
      };
    }
    walked += segmentLength;
  }

  return path.points[path.points.length - 1];
}

function getWinnerSlot(layout: MachineLayout, winnerIndex: number) {
  return {
    x: layout.winnerBaseX + winnerIndex * layout.winnerGap,
    y: layout.winnerY,
  };
}

function getRailAngle(progress: number) {
  const startAngle = -Math.PI * 0.56;
  const endAngle = Math.PI * 0.56;
  return startAngle + (endAngle - startAngle) * clamp(progress, 0, 1);
}

function getRailTrackRadius(layout: MachineLayout) {
  return layout.railRadiusInner + (layout.railRadiusOuter - layout.railRadiusInner) * 0.5;
}

function getRailPoint(layout: MachineLayout, progress: number) {
  const angle = getRailAngle(progress);
  const radius = getRailTrackRadius(layout);
  return {
    x: layout.railCenterX + Math.cos(angle) * radius,
    y: layout.railCenterY + Math.sin(angle) * radius,
  };
}

function getRailCollectorPoint(layout: MachineLayout) {
  return {
    x: layout.centerX + layout.drumRadius * 0.54,
    y: layout.winnerY - layout.ballRadius * 1.18,
  };
}

function buildWinnerPath(layout: MachineLayout, start: Point, winnerIndex: number) {
  const slot = getWinnerSlot(layout, winnerIndex);
  const railEntry = getRailPoint(layout, 0.08);
  const railMidTop = getRailPoint(layout, 0.28);
  const railMidBottom = getRailPoint(layout, 0.56);
  const railExit = getRailPoint(layout, 0.84);
  const collector = getRailCollectorPoint(layout);

  const points: Point[] = [
    start,
    {
      x: layout.centerX + layout.drumRadius * 0.22,
      y: layout.centerY - layout.drumRadius * 0.08,
    },
    {
      x: layout.centerX + layout.drumRadius * 0.45,
      y: layout.centerY - layout.drumRadius * 0.36,
    },
    {
      x: layout.centerX + layout.drumRadius * 0.6,
      y: layout.centerY - layout.drumRadius * 0.62,
    },
    {
      x: layout.outletX,
      y: layout.outletY,
    },
    railEntry,
    railMidTop,
    railMidBottom,
    railExit,
    collector,
    {
      x: slot.x,
      y: layout.winnerStartY,
    },
    slot,
  ];

  return buildPathMetrics(points);
}

function createBalls(layout: MachineLayout): Ball[] {
  const balls: Ball[] = [];
  const minDistance = layout.ballRadius * 2.02;

  for (let label = 1; label <= TOTAL_BALLS; label += 1) {
    let x = layout.centerX;
    let y = layout.centerY;

    for (let attempt = 0; attempt < 240; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * layout.drumRadius * 0.72;
      const candidateX = layout.centerX + Math.cos(angle) * distance;
      const candidateY =
        layout.centerY + Math.sin(angle) * distance + layout.drumRadius * 0.08;
      const inside =
        Math.hypot(candidateX - layout.centerX, candidateY - layout.centerY) <
        layout.drumRadius - layout.ballRadius * 1.3;
      const clear = balls.every(
        (ball) => Math.hypot(ball.x - candidateX, ball.y - candidateY) >= minDistance,
      );

      if (inside && clear) {
        x = candidateX;
        y = candidateY;
        break;
      }
    }

    balls.push({
      id: label,
      label,
      color: getLottoColor(label),
      radius: layout.ballRadius,
      x,
      y,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.2,
      state: "drum",
      winnerIndex: null,
    });
  }

  return balls;
}
function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  x: number,
  y: number,
  radius: number,
) {
  ctx.save();

  const shadowGradient = ctx.createRadialGradient(
    x,
    y + radius * 0.28,
    radius * 0.15,
    x,
    y + radius * 0.28,
    radius * 1.2,
  );
  shadowGradient.addColorStop(0, "rgba(15, 23, 42, 0.24)");
  shadowGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(x, y + radius * 0.68, radius * 1.02, radius * 0.54, 0, 0, Math.PI * 2);
  ctx.fill();

  const gradient = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.35,
    radius * 0.15,
    x,
    y,
    radius * 1.1,
  );
  gradient.addColorStop(0, mixHex(ball.color, 0.72, "#ffffff"));
  gradient.addColorStop(0.34, mixHex(ball.color, 0.26, "#ffffff"));
  gradient.addColorStop(0.72, ball.color);
  gradient.addColorStop(1, mixHex(ball.color, 0.34, "#000000"));

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(1.4, radius * 0.12);
  ctx.strokeStyle = rgba(mixHex(ball.color, 0.2, "#000000"), 0.22);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x + radius * 0.02, y, radius * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.36)";
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.24,
    y - radius * 0.34,
    radius * 0.24,
    radius * 0.13,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.font = `700 ${Math.max(10, radius * 0.88)}px var(--font-roboto), system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(ball.label), x, y + radius * 0.03);

  ctx.restore();
}

function drawMachineScene(
  ctx: CanvasRenderingContext2D,
  layout: MachineLayout,
  balls: Ball[],
  drumAngle: number,
  activeEjection: ActiveEjection | null,
  themeMode: "light" | "dark",
) {
  const width = layout.width;
  const height = layout.height;
  const isLight = themeMode === "light";
  const backgroundTop = isLight ? "#f8fbff" : "#040d1a";
  const backgroundBottom = isLight ? "#edf3fb" : "#031021";
  const machineStroke = isLight
    ? "rgba(100, 116, 139, 0.82)"
    : "rgba(148, 163, 184, 0.74)";
  const innerStroke = isLight
    ? "rgba(148, 163, 184, 0.34)"
    : "rgba(226, 232, 240, 0.18)";
  const trackFill = isLight ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.08)";
  const trayFill = isLight ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.1)";
  const supportFill = isLight ? "rgba(203, 213, 225, 0.8)" : "rgba(71, 85, 105, 0.68)";
  const railStartAngle = -Math.PI * 0.56;
  const railEndAngle = Math.PI * 0.56;
  const railBandRadius = getRailTrackRadius(layout);
  const railEntryOuter = {
    x: layout.railCenterX + Math.cos(railStartAngle) * layout.railRadiusOuter,
    y: layout.railCenterY + Math.sin(railStartAngle) * layout.railRadiusOuter,
  };
  const railEntryInner = {
    x: layout.railCenterX + Math.cos(railStartAngle) * layout.railRadiusInner,
    y: layout.railCenterY + Math.sin(railStartAngle) * layout.railRadiusInner,
  };
  const railExitOuter = {
    x: layout.railCenterX + Math.cos(railEndAngle) * layout.railRadiusOuter,
    y: layout.railCenterY + Math.sin(railEndAngle) * layout.railRadiusOuter,
  };
  const railExitInner = {
    x: layout.railCenterX + Math.cos(railEndAngle) * layout.railRadiusInner,
    y: layout.railCenterY + Math.sin(railEndAngle) * layout.railRadiusInner,
  };
  const collector = getRailCollectorPoint(layout);

  const bgGradient = ctx.createLinearGradient(0, 0, width, 0);
  bgGradient.addColorStop(0, backgroundTop);
  bgGradient.addColorStop(0.45, isLight ? "#f3f7fd" : "#02121f");
  bgGradient.addColorStop(1, backgroundBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    layout.centerX,
    layout.centerY,
    layout.drumRadius * 0.24,
    layout.centerX,
    layout.centerY,
    layout.drumRadius * 1.7,
  );
  glow.addColorStop(0, isLight ? "rgba(99, 102, 241, 0.07)" : "rgba(56, 189, 248, 0.16)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = machineStroke;
  ctx.lineWidth = Math.max(3, layout.width * 0.0062);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(
    layout.railCenterX,
    layout.railCenterY,
    layout.railRadiusOuter,
    railStartAngle,
    railEndAngle,
    false,
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    layout.railCenterX,
    layout.railCenterY,
    layout.railRadiusInner,
    railStartAngle,
    railEndAngle,
    false,
  );
  ctx.stroke();

  const connectorControl = {
    x: layout.centerX + layout.drumRadius * 1.06,
    y: layout.centerY - layout.drumRadius * 1.1,
  };

  ctx.beginPath();
  ctx.moveTo(layout.outletX - layout.ballRadius * 0.42, layout.outletY + layout.ballRadius * 0.1);
  ctx.quadraticCurveTo(
    connectorControl.x,
    connectorControl.y,
    railEntryOuter.x,
    railEntryOuter.y,
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(layout.outletX - layout.ballRadius * 0.02, layout.outletY + layout.ballRadius * 0.54);
  ctx.quadraticCurveTo(
    connectorControl.x - layout.ballRadius * 0.2,
    connectorControl.y + layout.ballRadius * 0.44,
    railEntryInner.x,
    railEntryInner.y,
  );
  ctx.stroke();

  const rampControl = {
    x: layout.centerX + layout.drumRadius * 1.02,
    y: layout.centerY + layout.drumRadius * 1.02,
  };

  ctx.beginPath();
  ctx.moveTo(railExitOuter.x, railExitOuter.y);
  ctx.quadraticCurveTo(
    rampControl.x,
    rampControl.y,
    collector.x + layout.ballRadius * 0.5,
    collector.y - layout.ballRadius * 0.06,
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(railExitInner.x, railExitInner.y);
  ctx.quadraticCurveTo(
    rampControl.x - layout.ballRadius * 0.14,
    rampControl.y + layout.ballRadius * 0.26,
    collector.x + layout.ballRadius * 0.12,
    collector.y + layout.ballRadius * 0.5,
  );
  ctx.stroke();

  for (let index = 0; index < 5; index += 1) {
    const ratio = index / 4;
    const angle = railStartAngle + (railEndAngle - railStartAngle) * (0.12 + ratio * 0.76);
    const x = layout.railCenterX + Math.cos(angle) * railBandRadius;
    const y = layout.railCenterY + Math.sin(angle) * railBandRadius;
    const rotation = angle + Math.PI / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = trackFill;
    ctx.strokeStyle = innerStroke;
    ctx.lineWidth = Math.max(1.1, layout.width * 0.0024);
    roundRect(
      ctx,
      -layout.ballRadius * 0.56,
      -layout.ballRadius * 0.18,
      layout.ballRadius * 1.12,
      layout.ballRadius * 0.36,
      layout.ballRadius * 0.2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = supportFill;
  roundRect(
    ctx,
    layout.machineFootX,
    layout.machineFootY,
    layout.drumRadius * 0.34,
    layout.drumRadius * 0.34,
    layout.drumRadius * 0.08,
  );
  ctx.fill();
  ctx.restore();

  ctx.save();
  const drumGradient = ctx.createRadialGradient(
    layout.centerX - layout.drumRadius * 0.34,
    layout.centerY - layout.drumRadius * 0.36,
    layout.drumRadius * 0.18,
    layout.centerX,
    layout.centerY,
    layout.drumRadius,
  );
  drumGradient.addColorStop(0, isLight ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.26)");
  drumGradient.addColorStop(0.46, isLight ? "rgba(255,255,255,0.76)" : "rgba(255,255,255,0.14)");
  drumGradient.addColorStop(
    1,
    isLight ? "rgba(226,232,240,0.52)" : "rgba(148,163,184,0.12)",
  );

  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, layout.drumRadius, 0, Math.PI * 2);
  ctx.fillStyle = drumGradient;
  ctx.fill();

  const drumBalls = balls
    .filter((ball) => ball.state === "drum")
    .slice()
    .sort((a, b) => a.y - b.y);

  for (const ball of drumBalls) {
    drawBall(ctx, ball, ball.x, ball.y, ball.radius);
  }

  if (activeEjection) {
    const ejectionBall = balls.find((ball) => ball.id === activeEjection.ballId);
    if (ejectionBall) {
      const progress = clamp(
        (performance.now() - activeEjection.startedAt) / activeEjection.duration,
        0,
        1,
      );
      const point = samplePath(activeEjection.path, easeInOutCubic(progress));
      drawBall(
        ctx,
        ejectionBall,
        point.x,
        point.y,
        ejectionBall.radius * (progress > 0.84 ? 1.03 : 1),
      );
    }
  }

  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, layout.drumRadius, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(4, layout.width * 0.0072);
  ctx.strokeStyle = isLight ? "rgba(148,163,184,0.82)" : "rgba(203,213,225,0.3)";
  ctx.stroke();

  const reflection = ctx.createLinearGradient(
    layout.centerX - layout.drumRadius,
    layout.centerY - layout.drumRadius,
    layout.centerX + layout.drumRadius,
    layout.centerY + layout.drumRadius,
  );
  reflection.addColorStop(0, isLight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.16)");
  reflection.addColorStop(0.34, "rgba(255,255,255,0.08)");
  reflection.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = reflection;
  ctx.lineWidth = Math.max(8, layout.width * 0.018);
  ctx.beginPath();
  ctx.arc(
    layout.centerX - layout.drumRadius * 0.1,
    layout.centerY,
    layout.drumRadius * 0.93,
    Math.PI * 0.72,
    Math.PI * 1.34,
  );
  ctx.stroke();

  ctx.fillStyle = trayFill;
  roundRect(
    ctx,
    layout.trayX,
    layout.trayY - layout.ballRadius * 1.02,
    layout.trayWidth,
    layout.ballRadius * 1.58,
    layout.ballRadius * 0.82,
  );
  ctx.fill();

  ctx.strokeStyle = machineStroke;
  ctx.lineWidth = Math.max(2.4, layout.width * 0.0042);
  roundRect(
    ctx,
    layout.trayX,
    layout.trayY - layout.ballRadius * 1.02,
    layout.trayWidth,
    layout.ballRadius * 1.58,
    layout.ballRadius * 0.82,
  );
  ctx.stroke();

  for (let index = 0; index < DRAW_COUNT; index += 1) {
    const slot = getWinnerSlot(layout, index);
    ctx.strokeStyle = innerStroke;
    ctx.lineWidth = Math.max(1.2, layout.width * 0.0024);
    ctx.beginPath();
    ctx.arc(slot.x, layout.winnerY, layout.winnerSlotRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const winnerBalls = balls
    .filter((ball) => ball.state === "winner" && ball.winnerIndex !== null)
    .slice()
    .sort((a, b) => (a.winnerIndex ?? 0) - (b.winnerIndex ?? 0));

  for (const ball of winnerBalls) {
    const slot = getWinnerSlot(layout, ball.winnerIndex ?? 0);
    drawBall(ctx, ball, slot.x, slot.y, ball.radius);
  }
}
export default function LottoMachine() {
  const theme = useTheme();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [layout, setLayout] = React.useState<MachineLayout>(() => getMachineLayout(860));
  const [phase, setPhase] = React.useState<MachinePhase>("idle");
  const [winners, setWinners] = React.useState<number[]>([]);
  const [history, setHistory] = React.useState<DrawHistoryEntry[]>([]);

  const ballsRef = React.useRef<Ball[]>(createBalls(getMachineLayout(860)));
  const runtimeRef = React.useRef<MachineRuntime>({
    running: false,
    phase: "idle",
    drumAngle: 0,
    nextDrawAt: 0,
    activeEjection: null,
  });
  const layoutRef = React.useRef(layout);
  const lastFrameRef = React.useRef<number>(0);
  const animationFrameRef = React.useRef<number>(0);

  const syncUi = React.useCallback(() => {
    const nextWinners = ballsRef.current
      .filter((ball) => ball.state === "winner" && ball.winnerIndex !== null)
      .sort((a, b) => (a.winnerIndex ?? 0) - (b.winnerIndex ?? 0))
      .map((ball) => ball.label);

    setWinners(nextWinners);
    setPhase(runtimeRef.current.phase);
  }, []);

  const resetMachine = React.useCallback((nextLayout?: MachineLayout) => {
    const activeLayout = nextLayout ?? layoutRef.current;
    layoutRef.current = activeLayout;
    ballsRef.current = createBalls(activeLayout);
    runtimeRef.current = {
      running: false,
      phase: "idle",
      drumAngle: 0,
      nextDrawAt: 0,
      activeEjection: null,
    };
    setLayout(activeLayout);
    setPhase("idle");
    setWinners([]);
    if (!nextLayout) {
      setHistory([]);
    }
  }, []);

  const beginEjection = React.useCallback(
    (now: number) => {
      const activeLayout = layoutRef.current;
      const availableBalls = ballsRef.current.filter((ball) => ball.state === "drum");
      const winnerIndex = ballsRef.current.filter((ball) => ball.state === "winner").length;

      if (availableBalls.length === 0 || winnerIndex >= DRAW_COUNT) {
        return;
      }

      const candidate = availableBalls[Math.floor(Math.random() * availableBalls.length)];
      candidate.state = "ejecting";
      candidate.vx = 0;
      candidate.vy = 0;

      runtimeRef.current.activeEjection = {
        ballId: candidate.id,
        winnerIndex,
        startedAt: now,
        duration: 2050,
        path: buildWinnerPath(activeLayout, { x: candidate.x, y: candidate.y }, winnerIndex),
      };
      runtimeRef.current.phase = "drawing";
      syncUi();
    },
    [syncUi],
  );

  const finalizeEjection = React.useCallback(() => {
    const active = runtimeRef.current.activeEjection;
    if (!active) {
      return;
    }

    const activeLayout = layoutRef.current;
    const ball = ballsRef.current.find((item) => item.id === active.ballId);
    if (!ball) {
      runtimeRef.current.activeEjection = null;
      return;
    }

    const slot = getWinnerSlot(activeLayout, active.winnerIndex);
    ball.state = "winner";
    ball.winnerIndex = active.winnerIndex;
    ball.x = slot.x;
    ball.y = slot.y;
    ball.vx = 0;
    ball.vy = 0;

    runtimeRef.current.activeEjection = null;

    const winnerCount = ballsRef.current.filter((item) => item.state === "winner").length;
    if (winnerCount >= DRAW_COUNT) {
      const completedNumbers = ballsRef.current
        .filter((item) => item.state === "winner" && item.winnerIndex !== null)
        .sort((a, b) => (a.winnerIndex ?? 0) - (b.winnerIndex ?? 0))
        .map((item) => item.label);

      setHistory((prev) => [
        {
          round: prev.length + 1,
          numbers: completedNumbers,
        },
        ...prev,
      ]);
      runtimeRef.current.running = false;
      runtimeRef.current.phase = "complete";
    } else {
      runtimeRef.current.phase = "mixing";
      runtimeRef.current.nextDrawAt = performance.now() + 700;
    }

    syncUi();
  }, [syncUi]);

  const startDraw = React.useCallback(() => {
    if (runtimeRef.current.running) {
      return;
    }

    if (ballsRef.current.filter((ball) => ball.state === "winner").length >= DRAW_COUNT) {
      resetMachine();
      return;
    }

    runtimeRef.current.running = true;
    runtimeRef.current.phase = "mixing";
    runtimeRef.current.nextDrawAt = performance.now() + 900;
    syncUi();
  }, [resetMachine, syncUi]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect.width ?? 860;
      const nextLayout = getMachineLayout(width);
      setLayout(nextLayout);
      layoutRef.current = nextLayout;
      ballsRef.current.forEach((ball) => {
        ball.radius = nextLayout.ballRadius;
      });
      resetMachine(nextLayout);
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [resetMachine]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const renderFrame = (timestamp: number) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      const step = Math.min(2.2, elapsed / FRAME_DURATION);
      const activeLayout = layoutRef.current;
      const runtime = runtimeRef.current;
      const balls = ballsRef.current;

      const dpr = window.devicePixelRatio || 1;
      if (
        canvas.width !== activeLayout.width * dpr ||
        canvas.height !== activeLayout.height * dpr
      ) {
        canvas.width = activeLayout.width * dpr;
        canvas.height = activeLayout.height * dpr;
        canvas.style.width = `${activeLayout.width}px`;
        canvas.style.height = `${activeLayout.height}px`;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      runtime.drumAngle += (runtime.running ? 0.028 : 0.006) * step;

      if (runtime.activeEjection) {
        const progress =
          (timestamp - runtime.activeEjection.startedAt) / runtime.activeEjection.duration;
        if (progress >= 1) {
          finalizeEjection();
        }
      } else if (runtime.running && timestamp >= runtime.nextDrawAt) {
        beginEjection(timestamp);
      }

      const swirlStrength = runtime.running ? 0.18 * step : 0.02 * step;
      const gravity = runtime.running ? 0.24 * step : 0.36 * step;
      const centerPull = runtime.running ? 0.0045 * step : 0.002 * step;
      const boundary = activeLayout.drumRadius - activeLayout.ballRadius * 1.02;
      const floorY = activeLayout.centerY + activeLayout.drumRadius * 0.82 - activeLayout.ballRadius;

      for (const ball of balls) {
        if (ball.state !== "drum") {
          continue;
        }

        const dx = ball.x - activeLayout.centerX;
        const dy = ball.y - activeLayout.centerY;
        const distance = Math.max(0.0001, Math.hypot(dx, dy));
        const tangentX = -dy / distance;
        const tangentY = dx / distance;

        ball.vx += tangentX * swirlStrength + (-dx / distance) * centerPull;
        ball.vy += tangentY * swirlStrength + (-dy / distance) * centerPull + gravity;

        ball.x += ball.vx * step;
        ball.y += ball.vy * step;

        ball.vx *= runtime.running ? 0.994 : 0.989;
        ball.vy *= runtime.running ? 0.994 : 0.989;

        const newDx = ball.x - activeLayout.centerX;
        const newDy = ball.y - activeLayout.centerY;
        const newDistance = Math.hypot(newDx, newDy);

        if (newDistance > boundary) {
          const nx = newDx / newDistance;
          const ny = newDy / newDistance;
          ball.x = activeLayout.centerX + nx * boundary;
          ball.y = activeLayout.centerY + ny * boundary;

          const velocityAlongNormal = ball.vx * nx + ball.vy * ny;
          if (velocityAlongNormal > 0) {
            ball.vx -= velocityAlongNormal * nx * 1.88;
            ball.vy -= velocityAlongNormal * ny * 1.88;
          }
          ball.vx *= 0.98;
          ball.vy *= 0.98;
        }

        if (ball.y > floorY) {
          ball.y = floorY;
          if (ball.vy > 0) {
            ball.vy *= -0.72;
          }
          ball.vx *= 0.985;
        }
      }

      for (let index = 0; index < balls.length; index += 1) {
        const first = balls[index];
        if (first.state !== "drum") continue;

        for (let innerIndex = index + 1; innerIndex < balls.length; innerIndex += 1) {
          const second = balls[innerIndex];
          if (second.state !== "drum") continue;

          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const minDistance = first.radius + second.radius;

          if (distance < minDistance) {
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minDistance - distance;
            const correction = overlap * 0.52;

            first.x -= nx * correction;
            first.y -= ny * correction;
            second.x += nx * correction;
            second.y += ny * correction;

            const relativeVelocityX = second.vx - first.vx;
            const relativeVelocityY = second.vy - first.vy;
            const separatingSpeed = relativeVelocityX * nx + relativeVelocityY * ny;

            if (separatingSpeed < 0) {
              const impulse = -1.12 * separatingSpeed * 0.5;
              first.vx -= impulse * nx;
              first.vy -= impulse * ny;
              second.vx += impulse * nx;
              second.vy += impulse * ny;
            }
          }
        }
      }

      drawMachineScene(
        context,
        activeLayout,
        balls,
        runtime.drumAngle,
        runtime.activeEjection,
        theme.palette.mode,
      );

      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      lastFrameRef.current = 0;
    };
  }, [beginEjection, finalizeEjection, theme.palette.mode]);
  const buttonLabel =
    winners.length >= DRAW_COUNT ? "다시 추첨" : phase === "drawing" ? "추첨 중..." : "추첨 시작";

  return (
    <Stack spacing={2.25}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.25, md: 1.75 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box ref={containerRef} sx={{ width: "100%" }}>
          <canvas ref={canvasRef} />
        </Box>
      </Paper>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          {phase === "complete" ? <SlowMotionVideoRounded color="success" /> : <AutorenewRounded color={phase === "drawing" ? "warning" : "inherit"} />}
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {phase === "idle"
              ? "대기 중"
              : phase === "mixing"
                ? "공 섞는 중"
                : phase === "drawing"
                  ? "당첨공 배출 중"
                  : "추첨 완료"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            당첨공 {winners.length} / {DRAW_COUNT}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Button
            size="large"
            variant="contained"
            startIcon={<PlayArrowRounded />}
            onClick={startDraw}
            disabled={phase === "drawing"}
          >
            {buttonLabel}
          </Button>
          <Button
            size="large"
            variant="outlined"
            startIcon={<RestartAltRounded />}
            onClick={() => resetMachine()}
          >
            초기화
          </Button>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(180deg, rgba(79, 70, 229, 0.03), rgba(8, 145, 178, 0.04))"
              : "linear-gradient(180deg, rgba(96, 165, 250, 0.08), rgba(34, 211, 238, 0.08))",
        }}
      >
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" fontWeight={800}>
            당첨 결과
          </Typography>
          <Stack spacing={1}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
              sx={{ minHeight: 42 }}
            >
              {winners.length > 0 ? (
                winners.map((value) => <NumberBall key={`current-${value}`} n={value} size={36} mr={0} />)
              ) : (
                <Typography variant="body2" color="text.secondary">
                  아직 추첨된 공이 없습니다.
                </Typography>
              )}
            </Stack>

            {history.length > 0 && (
              <Stack spacing={1}>
                {history.map((entry) => (
                  <Stack
                    key={entry.round}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{
                      py: 1,
                      px: 1.25,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" sx={{ minWidth: 56, fontWeight: 700 }}>
                      {entry.round}회차
                    </Typography>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      {entry.numbers.map((n, index) => (
                        <NumberBall key={`${entry.round}-${index}-${n}`} n={n} size={32} mr={0} />
                      ))}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
