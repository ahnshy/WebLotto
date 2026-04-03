'use client';
import * as React from 'react';
import { Stack, Button, Card, CardContent, Typography } from '@mui/material';
import NumberBall from './NumberBall';

function generate(): number[] {
  const s = new Set<number>();
  while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45));
  return Array.from(s).sort((a, b) => a - b);
}

export default function GeneratorPanel({ onPickAction }: { onPickAction: (nums: number[]) => void }) {
  const [cur, setCur] = React.useState<number[] | null>(null);

  const click = () => {
    const g = generate();
    setCur(g);
    onPickAction(g);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2">난수 추출</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Button variant="contained" onClick={click}>새로 추출</Button>
          <Typography color="text.secondary">선택 결과와 당첨 이력을 비교합니다.</Typography>
        </Stack>
        {cur && (
          <Stack direction="row" sx={{ mt: 2, flexWrap: 'nowrap', whiteSpace: 'nowrap', overflowX: 'auto' }}>
            {cur.map((n) => <NumberBall key={n} n={n} size={40} mr={0.5} />)}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
