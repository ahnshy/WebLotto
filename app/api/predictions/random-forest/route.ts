import { NextResponse } from 'next/server';
import {
  buildRandomForestModelArtifact,
  generateRandomForestPrediction,
  getRandomForestStatus,
  saveDraw,
  warmRandomForestModel,
} from '@/lib/lottoAiServer';
import { isAdminEmail, stringifyError } from '@/lib/admin';

export async function GET() {
  try {
    await warmRandomForestModel();
    return NextResponse.json({ success: true, ...(await getRandomForestStatus()) });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 머신러닝 모델 준비 실패: ${stringifyError(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => null);

    if (searchParams.get('mode') === 'build') {
      if (!isAdminEmail(body?.email)) {
        return NextResponse.json({ error: '관리자만 머신러닝 모델을 생성할 수 있습니다.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        artifact: await buildRandomForestModelArtifact(true),
        status: await getRandomForestStatus(),
      });
    }

    const prediction = await generateRandomForestPrediction();
    const draw = await saveDraw(prediction.numbers, 'random_forest', [], {
      id: body?.ownerId ?? null,
      email: body?.ownerEmail ?? null,
    });

    return NextResponse.json({
      success: true,
      draw,
      prediction,
      status: await getRandomForestStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 머신러닝 추출 실패: ${stringifyError(error)}` },
      { status: 500 }
    );
  }
}
