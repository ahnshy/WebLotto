import { NextResponse } from 'next/server';
import {
  generateLstmPrediction,
  getLstmStatus,
  saveDraw,
  warmLstmModel,
} from '@/lib/lottoAiServer';

export async function GET() {
  try {
    await warmLstmModel();
    return NextResponse.json({ success: true, ...(await getLstmStatus()) });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 딥러닝 모델 준비 실패: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const prediction = await generateLstmPrediction();
    const draw = await saveDraw(prediction.numbers);

    return NextResponse.json({
      success: true,
      draw,
      prediction,
      status: await getLstmStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 딥러닝 추출 실패: ${String(error)}` },
      { status: 500 }
    );
  }
}
