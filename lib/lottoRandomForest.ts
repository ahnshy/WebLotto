import { RandomForestClassifier } from 'ml-random-forest';
import type { LottoRow } from '@/app/actions';

type RandomForestMetadata = {
  windowSize: number;
  sampleCount: number;
  trainedRounds: number;
  estimators: number;
  featureCount: number;
};

export type PreparedRandomForestModel = {
  classifiers: RandomForestClassifier[];
  latestFeatures: number[];
  metadata: RandomForestMetadata;
  latestRound: number;
  trainedAt: number;
};

export type RandomForestPredictionResult = {
  numbers: number[];
  topCandidates: Array<{ number: number; probability: number }>;
  metrics: RandomForestMetadata & {
    latestRound: number;
    trainedAt: number;
    cacheAgeMs: number;
  };
};

export type SerializedRandomForestModel = {
  classifiers: Array<ReturnType<RandomForestClassifier['toJSON']>>;
  latestFeatures: number[];
  metadata: RandomForestMetadata;
  latestRound: number;
  trainedAt: number;
};

function getMainNumbers(row: LottoRow): number[] {
  return [row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].sort((a, b) => a - b);
}

function ratio(value: number, total: number): number {
  return total === 0 ? 0 : value / total;
}

function buildFeatureVector(window: LottoRow[]): number[] {
  const totalRounds = window.length;
  const frequency = Array.from({ length: 45 }, () => 0);
  const recentGap = Array.from({ length: 45 }, () => totalRounds + 1);
  let oddCountSum = 0;
  let evenCountSum = 0;
  let totalNumberSum = 0;
  let lowCount = 0;
  let midCount = 0;
  let highCount = 0;
  let consecutiveCount = 0;
  let bonusOverlap = 0;

  window.forEach((row, rowIndex) => {
    const main = getMainNumbers(row);
    const mainSet = new Set(main);
    const oddCount = main.filter((n) => n % 2 === 1).length;
    oddCountSum += oddCount;
    evenCountSum += 6 - oddCount;
    totalNumberSum += main.reduce((sum, n) => sum + n, 0);

    for (const n of main) {
      frequency[n - 1] += 1;
      if (recentGap[n - 1] === totalRounds + 1) recentGap[n - 1] = totalRounds - rowIndex;
      if (n <= 15) lowCount += 1;
      else if (n <= 30) midCount += 1;
      else highCount += 1;
    }

    if (mainSet.has(row.bonus)) bonusOverlap += 1;
    for (let i = 1; i < main.length; i += 1) {
      if (main[i] - main[i - 1] === 1) consecutiveCount += 1;
    }
  });

  return [
    ...frequency.map((count) => ratio(count, totalRounds)),
    ...recentGap.map((gap) => ratio(gap, totalRounds + 1)),
    ratio(oddCountSum, totalRounds * 6),
    ratio(evenCountSum, totalRounds * 6),
    ratio(totalNumberSum, totalRounds * 45 * 6),
    ratio(lowCount, totalRounds * 6),
    ratio(midCount, totalRounds * 6),
    ratio(highCount, totalRounds * 6),
    ratio(consecutiveCount, Math.max(totalRounds * 5, 1)),
    ratio(bonusOverlap, totalRounds),
  ];
}

function buildDataset(rows: LottoRow[], windowSize: number) {
  const ordered = [...rows].sort((a, b) => a.round - b.round);
  if (ordered.length <= windowSize) {
    throw new Error(`Random Forest 학습에 필요한 회차가 부족합니다. 최소 ${windowSize + 1}회 이상 필요합니다.`);
  }

  const features: number[][] = [];
  const labels: number[][] = Array.from({ length: 45 }, () => []);

  for (let i = windowSize; i < ordered.length; i += 1) {
    const window = ordered.slice(i - windowSize, i);
    const target = new Set(getMainNumbers(ordered[i]));
    features.push(buildFeatureVector(window));

    for (let number = 1; number <= 45; number += 1) {
      labels[number - 1].push(target.has(number) ? 1 : 0);
    }
  }

  const latestFeatures = buildFeatureVector(ordered.slice(-windowSize));
  return { features, labels, latestFeatures, trainedRounds: ordered.length };
}

function weightedPick(probabilities: Array<{ number: number; probability: number }>, count: number): number[] {
  const pool = probabilities.slice(0, 20).map((item) => ({ ...item }));
  const selected: number[] = [];

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(item.probability, 0.001), 0);
    let point = Math.random() * total;
    let selectedIndex = 0;

    for (let i = 0; i < pool.length; i += 1) {
      point -= Math.max(pool[i].probability, 0.001);
      if (point <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const [picked] = pool.splice(selectedIndex, 1);
    selected.push(picked.number);
  }

  if (selected.length < count) {
    for (const item of probabilities) {
      if (!selected.includes(item.number)) selected.push(item.number);
      if (selected.length === count) break;
    }
  }

  return selected.sort((a, b) => a - b);
}

export function trainRandomForestModel(
  rows: LottoRow[],
  latestRound: number,
  options?: { windowSize?: number; estimators?: number }
): PreparedRandomForestModel {
  const windowSize = options?.windowSize ?? 16;
  const estimators = options?.estimators ?? 24;
  const { features, labels, latestFeatures, trainedRounds } = buildDataset(rows, windowSize);

  const rfOptions = {
    seed: 42,
    maxFeatures: 0.7,
    replacement: true,
    nEstimators: estimators,
    useSampleBagging: true,
    noOOB: true,
    treeOptions: {
      maxDepth: 8,
      minNumSamples: 4,
    },
  };

  const classifiers = Array.from({ length: 45 }, (_, index) => {
    const classifier = new RandomForestClassifier(rfOptions);
    classifier.train(features, labels[index]);
    return classifier;
  });

  return {
    classifiers,
    latestFeatures,
    latestRound,
    trainedAt: Date.now(),
    metadata: {
      windowSize,
      sampleCount: features.length,
      trainedRounds,
      estimators,
      featureCount: latestFeatures.length,
    },
  };
}

export function predictWithPreparedRandomForest(prepared: PreparedRandomForestModel): RandomForestPredictionResult {
  const probabilities = prepared.classifiers
    .map((classifier, index) => ({
      number: index + 1,
      probability: classifier.predictProbability([prepared.latestFeatures], 1)[0] ?? 0,
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    numbers: weightedPick(probabilities, 6),
    topCandidates: probabilities.slice(0, 12),
    metrics: {
      ...prepared.metadata,
      latestRound: prepared.latestRound,
      trainedAt: prepared.trainedAt,
      cacheAgeMs: Date.now() - prepared.trainedAt,
    },
  };
}

export function serializeRandomForestModel(prepared: PreparedRandomForestModel): SerializedRandomForestModel {
  return {
    classifiers: prepared.classifiers.map((classifier) => classifier.toJSON()),
    latestFeatures: prepared.latestFeatures,
    metadata: prepared.metadata,
    latestRound: prepared.latestRound,
    trainedAt: prepared.trainedAt,
  };
}

export function deserializeRandomForestModel(serialized: SerializedRandomForestModel): PreparedRandomForestModel {
  return {
    classifiers: serialized.classifiers.map((model) => RandomForestClassifier.load(model)),
    latestFeatures: serialized.latestFeatures,
    metadata: serialized.metadata,
    latestRound: serialized.latestRound,
    trainedAt: serialized.trainedAt,
  };
}
