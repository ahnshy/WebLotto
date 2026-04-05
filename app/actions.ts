'use server';
import { supabase } from '@/lib/supabaseClient';
export type DrawMethod =
  | 'random'
  | 'stat'
  | 'pattern'
  | 'lstm'
  | 'random_forest'
  | 'unknown';

export type DrawRow = {
  id: string;
  numbers: number[];
  created_at: string;
  extraction_method?: DrawMethod | null;
  extraction_tags?: string[] | null;
  owner_id?: string | null;
  owner_email?: string | null;
};
export type LottoRow = { round:number; draw_date:string; n1:number;n2:number;n3:number;n4:number;n5:number;n6:number; bonus:number; first_prize_winners?:number|null; first_prize_amount?:number|null };

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

export async function fetchDraws(ownerId?: string | null){
  const baseQuery = () => supabase.from('draws').select('*').order('created_at',{ascending:false}).limit(200);

  if (ownerId) {
    const scoped = await baseQuery().eq('owner_id', ownerId);
    if (!scoped.error) return scoped.data as DrawRow[];
    if (!isOwnerColumnError(scoped.error)) throw scoped.error;
  }

  const {data,error}=await baseQuery().is('owner_id', null);
  if(error) throw error; return data as DrawRow[];
}
export async function saveDraw(
  numbers:number[],
  extractionMethod: DrawMethod = 'unknown',
  extractionTags: string[] = [],
  owner?: { id?: string | null; email?: string | null }
){
  const ownerPayload = owner?.id ? { owner_id: owner.id, owner_email: owner.email ?? null } : {};

  const primary = await supabase
    .from('draws')
    .insert({numbers, extraction_method: extractionMethod, extraction_tags: extractionTags, ...ownerPayload})
    .select()
    .single();

  if (!primary.error) return primary.data as DrawRow;

  if (!(isExtractionMethodColumnError(primary.error) || isExtractionTagsColumnError(primary.error) || isOwnerColumnError(primary.error))) {
    throw primary.error;
  }

  const methodOnly = await supabase
    .from('draws')
    .insert({numbers, extraction_method: extractionMethod, ...ownerPayload})
    .select()
    .single();

  if (!methodOnly.error) return methodOnly.data as DrawRow;
  if (!(isExtractionMethodColumnError(methodOnly.error) || isOwnerColumnError(methodOnly.error))) throw methodOnly.error;

  const fallback = await supabase
    .from('draws')
    .insert({numbers, ...ownerPayload})
    .select()
    .single();

  if (!fallback.error) return fallback.data as DrawRow;
  if (!isOwnerColumnError(fallback.error)) throw fallback.error;

  const legacy = await supabase
    .from('draws')
    .insert({numbers})
    .select()
    .single();

  if (legacy.error) throw legacy.error;
  return legacy.data as DrawRow;
}
export async function deleteDraws(ids:string[], ownerId?: string | null){
  if(!ids?.length) return {count:0};

  if (ownerId) {
    const scoped = await supabase
      .from('draws')
      .delete({count:'exact'})
      .in('id',ids)
      .eq('owner_id', ownerId);
    if (!scoped.error) return {count:scoped.count??0};
    if (!isOwnerColumnError(scoped.error)) throw scoped.error;
  }

  const {error,count}=await supabase.from('draws').delete({count:'exact'}).in('id',ids).is('owner_id', null);
  if(error) throw error; return {count:count??0};
}

export async function fetchLottoHistoryAll(limit?: number){
  const pageSize = 1000;
  const rows: LottoRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = limit == null
      ? from + pageSize - 1
      : Math.min(from + pageSize - 1, limit - 1);

    const { data, error } = await supabase
      .from('kr_lotto_results')
      .select('*')
      .order('round', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const batch = (data ?? []) as LottoRow[];
    rows.push(...batch);

    if (limit != null && rows.length >= limit) {
      return rows.slice(0, limit);
    }

    if (batch.length < pageSize) {
      break;
    }
  }

  return rows;
}
export async function truncateLotto(){ const { error } = await supabase.from('kr_lotto_results').delete().neq('round', -1); if (error) throw error; return true; }
export async function upsertLottoBatch(rows: LottoRow[]){ if(!rows.length) return 0; const { error } = await supabase.from('kr_lotto_results').upsert(rows, { onConflict: 'round' }); if (error) throw error; return rows.length; }
