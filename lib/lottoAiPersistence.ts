import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier } from 'ml-random-forest';
import {
  type PreparedLstmModel,
  type SerializedLstmModel,
  deserializeLstmModel,
  serializeLstmModel,
} from '@/lib/lottoLstm';
import {
  type PreparedRandomForestModel,
  type SerializedRandomForestModel,
  deserializeRandomForestModel,
  serializeRandomForestModel,
} from '@/lib/lottoRandomForest';

const modelDir = path.join(process.cwd(), 'public', 'ai-models');

function lstmFileName(latestRound: number) {
  return `1_${latestRound}_LSTM.model`;
}

function randomForestFileName(latestRound: number) {
  return `1_${latestRound}_RandomForest.model`;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureModelDir() {
  await mkdir(modelDir, { recursive: true });
}

async function cleanupOldModels(pattern: RegExp, keepFileName: string) {
  const files = await readdir(modelDir).catch(() => []);
  await Promise.all(
    files
      .filter((file) => pattern.test(file) && file !== keepFileName)
      .map((file) => rm(path.join(modelDir, file), { force: true }))
  );
}

export async function saveLstmModelToDisk(prepared: PreparedLstmModel) {
  await ensureModelDir();
  const fileName = lstmFileName(prepared.latestRound);
  const filePath = path.join(modelDir, fileName);
  const serialized = await serializeLstmModel(prepared);
  await writeFile(filePath, JSON.stringify(serialized), 'utf8');
  await cleanupOldModels(/_LSTM\.model$/, fileName);
  return filePath;
}

export async function loadLstmModelFromDisk(latestRound: number): Promise<PreparedLstmModel | null> {
  await ensureModelDir();
  const filePath = path.join(modelDir, lstmFileName(latestRound));
  try {
    const raw = await readFile(filePath, 'utf8');
    const serialized = JSON.parse(raw) as SerializedLstmModel;
    return deserializeLstmModel(serialized);
  } catch {
    return null;
  }
}

export async function getExistingLstmModelPath(latestRound: number): Promise<string | null> {
  await ensureModelDir();
  const filePath = path.join(modelDir, lstmFileName(latestRound));
  return (await fileExists(filePath)) ? filePath : null;
}

export async function saveRandomForestModelToDisk(prepared: PreparedRandomForestModel) {
  await ensureModelDir();
  const fileName = randomForestFileName(prepared.latestRound);
  const filePath = path.join(modelDir, fileName);
  const serialized = serializeRandomForestModel(prepared);
  await writeFile(filePath, JSON.stringify(serialized), 'utf8');
  await cleanupOldModels(/_RandomForest\.model$/, fileName);
  return filePath;
}

export async function loadRandomForestModelFromDisk(latestRound: number): Promise<PreparedRandomForestModel | null> {
  await ensureModelDir();
  const filePath = path.join(modelDir, randomForestFileName(latestRound));
  try {
    const raw = await readFile(filePath, 'utf8');
    const serialized = JSON.parse(raw) as SerializedRandomForestModel;
    return deserializeRandomForestModel(serialized);
  } catch {
    return null;
  }
}

export async function getExistingRandomForestModelPath(latestRound: number): Promise<string | null> {
  await ensureModelDir();
  const filePath = path.join(modelDir, randomForestFileName(latestRound));
  return (await fileExists(filePath)) ? filePath : null;
}
