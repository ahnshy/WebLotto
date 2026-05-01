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
  getExistingLstmModelPath,
  getExistingRandomForestModelPath,
  loadLstmModelFromDisk,
  loadRandomForestModelFromDisk,
  saveLstmModelToDisk,
  saveRandomForestModelToDisk,
} from '@/lib/lottoAiPersistence';
import { stringifyError } from '@/lib/admin';

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
  return stringifyError(error);
}

function shouldFallbackToAnon(error: unknown) {
  const message = getErrorText(error).toLowerCase();
  return (
    message.includes('invalid api key') ||
    message.includes('jwt') ||
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  );
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

async function runWithDbFallback<T>(
  executor: (client: typeof supabase) => PromiseLike<{ data: T | null; error: unknown }>
): Promise<T> {
  const primaryClient = process.env.SUPABASE_SERVICE_ROLE ? supabaseAdmin : supabase;
  const primary = await executor(primaryClient);

  if (!primary.error && primary.data != null) {
    return primary.data;
  }

  if (process.env.SUPABASE_SERVICE_ROLE && shouldFallbackToAnon(primary.error)) {
    const fallback = await executor(supabase);
    if (!fallback.error && fallback.data != null) {
      return fallback.data;
    }
    throw fallback.error;
  }

  throw primary.error;
}

export async function fetchLatestRound(): Promise<number> {
  const data = await runWithDbFallback<{ round: number }>((client) =>
    client
      .from('kr_lotto_results')
      .select('round')
      .order('round', { ascending: false })
      .limit(1)
      .single()
  );

  return Number(data.round);
}

export async function fetchLottoHistoryAll(): Promise<LottoRow[]> {
  const pageSize = 1000;
  const rows: LottoRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const batch = await runWithDbFallback<LottoRow[]>((client) =>
      client
        .from('kr_lotto_results')
        .select('*')
        .order('round', { ascending: false })
        .range(from, to)
    );

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
  const clients = process.env.SUPABASE_SERVICE_ROLE ? [supabaseAdmin, supabase] : [supabase];

  for (const client of clients) {
    const primary = await client
      .from('draws')
      .insert({ numbers, extraction_method: extractionMethod, extraction_tags: extractionTags, ...ownerPayload })
      .select()
      .single();

    if (!primary.error) return primary.data as DrawRow;

    if (!(isExtractionMethodColumnError(primary.error) || isExtractionTagsColumnError(primary.error) || isOwnerColumnError(primary.error) || shouldFallbackToAnon(primary.error))) {
      throw primary.error;
    }

    const methodOnly = await client
      .from('draws')
      .insert({ numbers, extraction_method: extractionMethod, ...ownerPayload })
      .select()
      .single();

    if (!methodOnly.error) return methodOnly.data as DrawRow;
    if (!(isExtractionMethodColumnError(methodOnly.error) || isOwnerColumnError(methodOnly.error) || shouldFallbackToAnon(methodOnly.error))) {
      throw methodOnly.error;
    }

    const fallback = await client
      .from('draws')
      .insert({ numbers, ...ownerPayload })
      .select()
      .single();

    if (!fallback.error) return fallback.data as DrawRow;
    if (!isOwnerColumnError(fallback.error) && !shouldFallbackToAnon(fallback.error)) {
      throw fallback.error;
    }

    const legacy = await client
      .from('draws')
      .insert({ numbers })
      .select()
      .single();

    if (!legacy.error) return legacy.data as DrawRow;
    if (!shouldFallbackToAnon(legacy.error)) {
      throw legacy.error;
    }
  }

  throw new Error('draws 저장에 실패했습니다.');
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
    console.error('Failed to warm LSTM model:', stringifyError(error));
  });
}

export async function warmRandomForestModel(force = false) {
  const cache = getCache();
  const latestRound = await fetchLatestRound();
  const state = cache.randomForest;

  if (!force && state.prepared && state.latestRound === latestRound) return;
  if (!force && state.trainingPromise) return;

  void ensurePreparedRandomForestModel(force).catch((error) => {
    console.error('Failed to warm Random Forest model:', stringifyError(error));
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

export async function buildLstmModelArtifact(force = false) {
  const latestRound = await fetchLatestRound();
  if (!force) {
    const filePath = await getExistingLstmModelPath(latestRound);
    if (filePath) {
      return {
        filePath,
        latestRound,
        trainedAt: null,
      };
    }
  }

  const prepared = await ensurePreparedLstmModel(force);
  const filePath = await saveLstmModelToDisk(prepared);
  return {
    filePath,
    latestRound: prepared.latestRound,
    trainedAt: prepared.trainedAt,
  };
}

export async function buildRandomForestModelArtifact(force = false) {
  const latestRound = await fetchLatestRound();
  if (!force) {
    const filePath = await getExistingRandomForestModelPath(latestRound);
    if (filePath) {
      return {
        filePath,
        latestRound,
        trainedAt: null,
      };
    }
  }

  const prepared = await ensurePreparedRandomForestModel(force);
  const filePath = await saveRandomForestModelToDisk(prepared);
  return {
    filePath,
    latestRound: prepared.latestRound,
    trainedAt: prepared.trainedAt,
  };
}
