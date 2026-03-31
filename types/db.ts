export type DrawRow = { id: string; numbers: number[]; created_at: string };

export type KRLottoResult = {
  round: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number;
  first_prize_winners: number | null;
  first_prize_amount: number | null;
};

export type PredictionRow = {
  id: string;
  numbers: number[];
  created_at: string;
  win_status: 'pending' | 'win' | 'loss' | null;
  matched_count: number | null;
  bonus_matched: boolean | null;
};

