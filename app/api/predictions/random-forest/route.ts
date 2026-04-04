import { NextResponse } from 'next/server';
import {
  generateRandomForestPrediction,
  getRandomForestStatus,
  saveDraw,
  warmRandomForestModel,
} from '@/lib/lottoAiServer';

export async function GET() {
  try {
    await warmRandomForestModel();
    return NextResponse.json({ success: true, ...(await getRandomForestStatus()) });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 머신러닝 모델 준비 실패: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const prediction = await generateRandomForestPrediction();
    const draw = await saveDraw(prediction.numbers, 'random_forest');

    return NextResponse.json({
      success: true,
      draw,
      prediction,
      status: await getRandomForestStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 머신러닝 추출 실패: ${String(error)}` },
      { status: 500 }
    );
  }
}
