import * as tf from '@tensorflow/tfjs';
import type { LottoRow } from '@/app/actions';

type TrainingSample = {
  inputs: number[][][];
  targets: number[][];
  latestWindow: number[][];
};

type LstmMetadata = {
  windowSize: number;
  epochs: number;
  sampleCount: number;
  trainedRounds: number;
  lstmUnits: number;
  denseUnits: number;
  loss: number | null;
  valLoss: number | null;
};

export type PreparedLstmModel = {
  model: tf.LayersModel;
  latestWindow: number[][];
  metadata: LstmMetadata;
  latestRound: number;
  trainedAt: number;
};

export type LstmPredictionResult = {
  numbers: number[];
  topCandidates: Array<{ number: number; probability: number }>;
  metrics: LstmMetadata & {
    elapsedMs: number;
    latestRound: number;
    trainedAt: number;
    cacheAgeMs: number;
  };
};

export type SerializedLstmModel = {
  latestWindow: number[][];
  metadata: LstmMetadata;
  latestRound: number;
  trainedAt: number;
  modelArtifacts: {
    modelTopology: tf.io.ModelJSON['modelTopology'];
    format?: string;
    generatedBy?: string;
    convertedBy?: string | null;
    weightSpecs?: tf.io.WeightsManifestEntry[];
    weightData: string;
  };
};

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toWeightBuffer(weightData: tf.io.WeightData | null | undefined): Buffer {
  if (!weightData) return Buffer.alloc(0);
  if (weightData instanceof ArrayBuffer) return Buffer.from(weightData);
  if (ArrayBuffer.isView(weightData)) {
    return Buffer.from(weightData.buffer, weightData.byteOffset, weightData.byteLength);
  }
  if (Array.isArray(weightData)) {
    return Buffer.concat(weightData.map((item) => Buffer.from(item)));
  }
  return Buffer.alloc(0);
}

function normalizeRound(row: LottoRow): number[] {
  return [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6, row.bonus].map((n) => n / 45);
}

function buildTarget(row: LottoRow): number[] {
  const target = Array.from({ length: 45 }, () => 0);
  for (const n of [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6]) {
    target[n - 1] = 1;
  }
  return target;
}

function prepareTrainingData(rows: LottoRow[], windowSize: number): TrainingSample {
  const ordered = [...rows].sort((a, b) => a.round - b.round);
  if (ordered.length <= windowSize) {
    throw new Error(`LSTM 학습에 필요한 회차가 부족합니다. 최소 ${windowSize + 1}회 이상 필요합니다.`);
  }

  const inputs: number[][][] = [];
  const targets: number[][] = [];

  for (let i = windowSize; i < ordered.length; i += 1) {
    inputs.push(ordered.slice(i - windowSize, i).map(normalizeRound));
    targets.push(buildTarget(ordered[i]));
  }

  return {
    inputs,
    targets,
    latestWindow: ordered.slice(-windowSize).map(normalizeRound),
  };
}

function pickNumbers(probabilities: number[], count: number): number[] {
  const ranked = probabilities
    .map((probability, index) => ({ number: index + 1, probability }))
    .sort((a, b) => b.probability - a.probability);

  const selected: number[] = [];
  const pool = ranked.slice(0, 18);

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(item.probability, 1e-6), 0);
    let point = Math.random() * total;
    let pickedIndex = 0;

    for (let i = 0; i < pool.length; i += 1) {
      point -= Math.max(pool[i].probability, 1e-6);
      if (point <= 0) {
        pickedIndex = i;
        break;
      }
    }

    const [picked] = pool.splice(pickedIndex, 1);
    if (!selected.includes(picked.number)) selected.push(picked.number);
  }

  if (selected.length < count) {
    for (const item of ranked) {
      if (!selected.includes(item.number)) selected.push(item.number);
      if (selected.length === count) break;
    }
  }

  return selected.sort((a, b) => a - b);
}

export async function trainLstmModel(
  rows: LottoRow[],
  latestRound: number,
  options?: { windowSize?: number; epochs?: number; lstmUnits?: number; denseUnits?: number }
): Promise<PreparedLstmModel> {
  const windowSize = options?.windowSize ?? readPositiveInt(process.env.LOTTO_LSTM_WINDOW_SIZE, process.env.VERCEL ? 8 : 12);
  const epochs = options?.epochs ?? readPositiveInt(process.env.LOTTO_LSTM_EPOCHS, process.env.VERCEL ? 2 : 24);
  const lstmUnits = options?.lstmUnits ?? readPositiveInt(process.env.LOTTO_LSTM_UNITS, process.env.VERCEL ? 16 : 64);
  const denseUnits = options?.denseUnits ?? readPositiveInt(process.env.LOTTO_LSTM_DENSE_UNITS, process.env.VERCEL ? 24 : 64);
  const { inputs, targets, latestWindow } = prepareTrainingData(rows, windowSize);

  const x = tf.tensor3d(inputs);
  const y = tf.tensor2d(targets);

  const model = tf.sequential({
    layers: [
      tf.layers.lstm({
        units: lstmUnits,
        inputShape: [windowSize, 7],
      }),
      tf.layers.dense({ units: denseUnits, activation: 'relu' }),
      tf.layers.dense({ units: 45, activation: 'sigmoid' }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.008),
    loss: 'binaryCrossentropy',
  });

  const history = await model.fit(x, y, {
    epochs,
    batchSize: Math.min(32, Math.max(8, Math.floor(inputs.length / 8) || 8)),
    shuffle: true,
    validationSplit: inputs.length > 40 ? 0.15 : 0,
    verbose: 0,
  });

  x.dispose();
  y.dispose();

  const lossHistory = history.history.loss as number[] | undefined;
  const valLossHistory = history.history.val_loss as number[] | undefined;

  return {
    model,
    latestWindow,
    latestRound,
    trainedAt: Date.now(),
    metadata: {
      windowSize,
      epochs,
      sampleCount: inputs.length,
      trainedRounds: rows.length,
      lstmUnits,
      denseUnits,
      loss: lossHistory?.length ? lossHistory[lossHistory.length - 1] : null,
      valLoss: valLossHistory?.length ? valLossHistory[valLossHistory.length - 1] : null,
    },
  };
}

export async function serializeLstmModel(prepared: PreparedLstmModel): Promise<SerializedLstmModel> {
  let savedArtifacts: tf.io.ModelArtifacts | null = null;

  await prepared.model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      savedArtifacts = artifacts;
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: JSON.stringify(artifacts.modelTopology).length,
          weightSpecsBytes: JSON.stringify(artifacts.weightSpecs ?? []).length,
          weightDataBytes: toWeightBuffer(artifacts.weightData).byteLength,
        },
      };
    })
  );

  if (!savedArtifacts) {
    throw new Error('LSTM 모델 직렬화에 실패했습니다.');
  }

  const artifacts = savedArtifacts as tf.io.ModelArtifacts;

  return {
    latestWindow: prepared.latestWindow,
    metadata: prepared.metadata,
    latestRound: prepared.latestRound,
    trainedAt: prepared.trainedAt,
    modelArtifacts: {
      modelTopology: artifacts.modelTopology as tf.io.ModelJSON['modelTopology'],
      format: artifacts.format,
      generatedBy: artifacts.generatedBy,
      convertedBy: artifacts.convertedBy,
      weightSpecs: artifacts.weightSpecs,
      weightData: toWeightBuffer(artifacts.weightData).toString('base64'),
    },
  };
}

export async function deserializeLstmModel(serialized: SerializedLstmModel): Promise<PreparedLstmModel> {
  const model = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: serialized.modelArtifacts.modelTopology,
      format: serialized.modelArtifacts.format,
      generatedBy: serialized.modelArtifacts.generatedBy,
      convertedBy: serialized.modelArtifacts.convertedBy,
      weightSpecs: serialized.modelArtifacts.weightSpecs,
      weightData: Buffer.from(serialized.modelArtifacts.weightData, 'base64'),
    })
  );

  return {
    model,
    latestWindow: serialized.latestWindow,
    metadata: serialized.metadata,
    latestRound: serialized.latestRound,
    trainedAt: serialized.trainedAt,
  };
}

export async function predictWithPreparedLstm(prepared: PreparedLstmModel): Promise<LstmPredictionResult> {
  const start = Date.now();
  const inputTensor = tf.tensor3d([prepared.latestWindow]);
  const predictionTensor = prepared.model.predict(inputTensor) as tf.Tensor;
  const predictionValues = Array.from(await predictionTensor.data());

  inputTensor.dispose();
  predictionTensor.dispose();

  const topCandidates = predictionValues
    .map((probability, index) => ({ number: index + 1, probability }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 12);

  return {
    numbers: pickNumbers(predictionValues, 6),
    topCandidates,
    metrics: {
      ...prepared.metadata,
      elapsedMs: Date.now() - start,
      latestRound: prepared.latestRound,
      trainedAt: prepared.trainedAt,
      cacheAgeMs: Date.now() - prepared.trainedAt,
    },
  };
}

export function disposePreparedLstm(prepared: PreparedLstmModel | null | undefined) {
  prepared?.model.dispose();
}
