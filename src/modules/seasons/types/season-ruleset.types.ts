export type SeasonTiebreaker =
  | "points"
  | "goal_difference"
  | "goals_for"
  | "head_to_head"
  | "score_difference"
  | "wins";

export interface SeasonStandingsRuleset {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  tiebreakers: SeasonTiebreaker[];
}

export interface SeasonMatchRuleset {
  allowDraws: boolean;
  hasExtraTime: boolean;
  hasPenalties: boolean;
  hasOvertime: boolean;
}

export interface SeasonRuleset {
  sport: string;
  standings: SeasonStandingsRuleset;
  match: SeasonMatchRuleset;
}
