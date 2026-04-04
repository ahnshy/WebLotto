import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

const uploadDir = path.join(process.cwd(), 'Upload');

function lstmFileName(latestRound: number) {
  return `1_${latestRound}_LSTM.model`;
}

function randomForestFileName(latestRound: number) {
  return `1_${latestRound}_RandomForest.model`;
}

async function ensureUploadDir() {
  await mkdir(uploadDir, { recursive: true });
}

async function cleanupOldModels(pattern: RegExp, keepFileName: string) {
  const files = await readdir(uploadDir).catch(() => []);
  await Promise.all(
    files
      .filter((file) => pattern.test(file) && file !== keepFileName)
      .map((file) => rm(path.join(uploadDir, file), { force: true }))
  );
}

export async function saveLstmModelToDisk(prepared: PreparedLstmModel) {
  await ensureUploadDir();
  const fileName = lstmFileName(prepared.latestRound);
  const filePath = path.join(uploadDir, fileName);
  const serialized = await serializeLstmModel(prepared);
  await writeFile(filePath, JSON.stringify(serialized), 'utf8');
  await cleanupOldModels(/_LSTM\.model$/, fileName);
  return filePath;
}

export async function loadLstmModelFromDisk(latestRound: number): Promise<PreparedLstmModel | null> {
  await ensureUploadDir();
  const filePath = path.join(uploadDir, lstmFileName(latestRound));
  try {
    const raw = await readFile(filePath, 'utf8');
    const serialized = JSON.parse(raw) as SerializedLstmModel;
    return deserializeLstmModel(serialized);
  } catch {
    return null;
  }
}

export async function saveRandomForestModelToDisk(prepared: PreparedRandomForestModel) {
  await ensureUploadDir();
  const fileName = randomForestFileName(prepared.latestRound);
  const filePath = path.join(uploadDir, fileName);
  const serialized = serializeRandomForestModel(prepared);
  await writeFile(filePath, JSON.stringify(serialized), 'utf8');
  await cleanupOldModels(/_RandomForest\.model$/, fileName);
  return filePath;
}

export async function loadRandomForestModelFromDisk(latestRound: number): Promise<PreparedRandomForestModel | null> {
  await ensureUploadDir();
  const filePath = path.join(uploadDir, randomForestFileName(latestRound));
  try {
    const raw = await readFile(filePath, 'utf8');
    const serialized = JSON.parse(raw) as SerializedRandomForestModel;
    return deserializeRandomForestModel(serialized);
  } catch {
    return null;
  }
}
