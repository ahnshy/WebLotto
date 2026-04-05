import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { DrawMethod, DrawRow, LottoRow } from '@/app/actions';
import {
  disposePreparedLstm,
  predictWithPreparedLstm,
  trainLstmModel,
  type PreparedLstmModel,
} from '@/lib/lottoLstm';
import {
  predictWithPreparedRandomForest,
  trainRandomForestModel,
  type PreparedRandomForestModel,
} from '@/lib/lottoRandomForest';
import {
  loadLstmModelFromDisk,
  loadRandomForestModelFromDisk,
  saveLstmModelToDisk,
  saveRandomForestModelToDisk,
} from '@/lib/lottoAiPersistence';

const db = process.env.SUPABASE_SERVICE_ROLE ? supabaseAdmin : supabase;

type ModelState<T> = {
  prepared: T | null;
  trainingPromise: Promise<T> | null;
  latestRound: number | null;
};

type LottoAiCache = {
  lstm: ModelState<PreparedLstmModel>;
  randomForest: ModelState<PreparedRandomForestModel>;
};

declare global {
  var __lottoAiCache__: LottoAiCache | undefined;
}

function isExtractionMethodColumnError(error: unknown) {
  const message = getErrorText(error);
  return message.includes('extraction_method');
}

function isExtractionTagsColumnError(error: unknown) {
  const message = getErrorText(error);
  return message.includes('extraction_tags');
}

function isOwnerColumnError(error: unknown) {
  const message = getErrorText(error);
  return message.includes('owner_id') || message.includes('owner_email');
}

function getErrorText(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean).join(' ');
  }
  return String(error ?? '');
}

function getCache(): LottoAiCache {
  if (!globalThis.__lottoAiCache__) {
    globalThis.__lottoAiCache__ = {
      lstm: { prepared: null, trainingPromise: null, latestRound: null },
      randomForest: { prepared: null, trainingPromise: null, latestRound: null },
    };
  }
  return globalThis.__lottoAiCache__;
}

export async function fetchLatestRound(): Promise<number> {
  const { data, error } = await db
    .from('kr_lotto_results')
    .select('round')
    .order('round', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return Number(data.round);
}

export async function fetchLottoHistoryAll(): Promise<LottoRow[]> {
  const pageSize = 1000;
  const rows: LottoRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await db
      .from('kr_lotto_results')
      .select('*')
      .order('round', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const batch = (data ?? []) as LottoRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

export async function saveDraw(
  numbers: number[],
  extractionMethod: DrawMethod,
  extractionTags: string[] = [],
  owner?: { id?: string | null; email?: string | null }
): Promise<DrawRow> {
  const ownerPayload = owner?.id ? { owner_id: owner.id, owner_email: owner.email ?? null } : {};

  const primary = await db
    .from('draws')
    .insert({ numbers, extraction_method: extractionMethod, extraction_tags: extractionTags, ...ownerPayload })
    .select()
    .single();

  if (!primary.error) return primary.data as DrawRow;

  if (!(isExtractionMethodColumnError(primary.error) || isExtractionTagsColumnError(primary.error) || isOwnerColumnError(primary.error))) {
    throw primary.error;
  }

  const methodOnly = await db
    .from('draws')
    .insert({ numbers, extraction_method: extractionMethod, ...ownerPayload })
    .select()
    .single();

  if (!methodOnly.error) return methodOnly.data as DrawRow;
  if (!(isExtractionMethodColumnError(methodOnly.error) || isOwnerColumnError(methodOnly.error))) throw methodOnly.error;

  const fallback = await db
    .from('draws')
    .insert({ numbers, ...ownerPayload })
    .select()
    .single();

  if (!fallback.error) return fallback.data as DrawRow;
  if (!isOwnerColumnError(fallback.error)) throw fallback.error;

  const legacy = await db
    .from('draws')
    .insert({ numbers })
    .select()
    .single();

  if (legacy.error) throw legacy.error;
  return legacy.data as DrawRow;
}

export async function ensurePreparedLstmModel(force = false) {
  const cache = getCache();
  const latestRound = await fetchLatestRound();
  const state = cache.lstm;

  if (!force && state.prepared && state.latestRound === latestRound) {
    return state.prepared;
  }

  if (!force) {
    const fromDisk = await loadLstmModelFromDisk(latestRound);
    if (fromDisk) {
      disposePreparedLstm(state.prepared);
      state.prepared = fromDisk;
      state.latestRound = latestRound;
      return fromDisk;
    }
  }

  if (!force && state.trainingPromise) {
    return state.trainingPromise;
  }

  state.trainingPromise = (async () => {
    const history = await fetchLottoHistoryAll();
    const prepared = await trainLstmModel(history, latestRound);
    disposePreparedLstm(state.prepared);
    state.prepared = prepared;
    state.latestRound = latestRound;
    await saveLstmModelToDisk(prepared);
    state.trainingPromise = null;
    return prepared;
  })().catch((error) => {
    state.trainingPromise = null;
    throw error;
  });

  return state.trainingPromise;
}

export async function ensurePreparedRandomForestModel(force = false) {
  const cache = getCache();
  const latestRound = await fetchLatestRound();
  const state = cache.randomForest;

  if (!force && state.prepared && state.latestRound === latestRound) {
    return state.prepared;
  }

  if (!force) {
    const fromDisk = await loadRandomForestModelFromDisk(latestRound);
    if (fromDisk) {
      state.prepared = fromDisk;
      state.latestRound = latestRound;
      return fromDisk;
    }
  }

  if (!force && state.trainingPromise) {
    return state.trainingPromise;
  }

  state.trainingPromise = (async () => {
    const history = await fetchLottoHistoryAll();
    const prepared = trainRandomForestModel(history, latestRound);
    state.prepared = prepared;
    state.latestRound = latestRound;
    await saveRandomForestModelToDisk(prepared);
    state.trainingPromise = null;
    return prepared;
  })().catch((error) => {
    state.trainingPromise = null;
    throw error;
  });

  return state.trainingPromise;
}

export async function warmLstmModel(force = false) {
  const cache = getCache();
  const latestRound = await fetchLatestRound();
  const state = cache.lstm;

  if (!force && state.prepared && state.latestRound === latestRound) return;
  if (!force && state.trainingPromise) return;

  void ensurePreparedLstmModel(force).catch((error) => {
    console.error('Failed to warm LSTM model:', error);
  });
}

export async function warmRandomForestModel(force = false) {
  const cache = getCache();
  const latestRound = await fetchLatestRound();
  const state = cache.randomForest;

  if (!force && state.prepared && state.latestRound === latestRound) return;
  if (!force && state.trainingPromise) return;

  void ensurePreparedRandomForestModel(force).catch((error) => {
    console.error('Failed to warm Random Forest model:', error);
  });
}

export async function getLstmStatus() {
  const state = getCache().lstm;
  return {
    ready: Boolean(state.prepared),
    training: Boolean(state.trainingPromise),
    latestRound: state.latestRound,
    trainedAt: state.prepared?.trainedAt ?? null,
  };
}

export async function getRandomForestStatus() {
  const state = getCache().randomForest;
  return {
    ready: Boolean(state.prepared),
    training: Boolean(state.trainingPromise),
    latestRound: state.latestRound,
    trainedAt: state.prepared?.trainedAt ?? null,
  };
}

export async function generateLstmPrediction() {
  const prepared = await ensurePreparedLstmModel();
  return predictWithPreparedLstm(prepared);
}

export async function generateRandomForestPrediction() {
  const prepared = await ensurePreparedRandomForestModel();
  return predictWithPreparedRandomForest(prepared);
}
