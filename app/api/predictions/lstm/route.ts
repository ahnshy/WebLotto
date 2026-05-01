import { NextResponse } from 'next/server';
import {
  buildLstmModelArtifact,
  generateLstmPrediction,
  getLstmStatus,
  saveDraw,
  warmLstmModel,
} from '@/lib/lottoAiServer';
import { isAdminEmail, stringifyError } from '@/lib/admin';

export async function GET() {
  try {
    await warmLstmModel();
    return NextResponse.json({ success: true, ...(await getLstmStatus()) });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 딥러닝 모델 준비 실패: ${stringifyError(error)}` },
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
        return NextResponse.json({ error: '관리자만 딥러닝 모델을 생성할 수 있습니다.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        artifact: await buildLstmModelArtifact(true),
        status: await getLstmStatus(),
      });
    }

    const prediction = await generateLstmPrediction();
    const draw = await saveDraw(prediction.numbers, 'lstm', [], {
      id: body?.ownerId ?? null,
      email: body?.ownerEmail ?? null,
    });

    return NextResponse.json({
      success: true,
      draw,
      prediction,
      status: await getLstmStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `AI 딥러닝 추출 실패: ${stringifyError(error)}` },
      { status: 500 }
    );
  }
}
