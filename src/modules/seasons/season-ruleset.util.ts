import { SeasonRuleset, SeasonTiebreaker } from "./types/season-ruleset.types";

const DEFAULT_TIEBREAKERS: SeasonTiebreaker[] = ["points", "goal_difference", "goals_for"];
const BASKETBALL_TIEBREAKERS: SeasonTiebreaker[] = ["points", "head_to_head", "score_difference"];
const VALID_TIEBREAKERS = new Set<SeasonTiebreaker>([
  "points",
  "goal_difference",
  "goals_for",
  "head_to_head",
  "score_difference",
  "wins",
]);

const PRESET_RULESETS: Record<string, SeasonRuleset> = {
  generic: {
    sport: "generic",
    standings: {
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      tiebreakers: DEFAULT_TIEBREAKERS,
    },
    match: {
      allowDraws: true,
      hasExtraTime: false,
      hasPenalties: false,
      hasOvertime: false,
    },
  },
  football: {
    sport: "football",
    standings: {
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      tiebreakers: DEFAULT_TIEBREAKERS,
    },
    match: {
      allowDraws: true,
      hasExtraTime: true,
      hasPenalties: true,
      hasOvertime: false,
    },
  },
  basketball: {
    sport: "basketball",
    standings: {
      winPoints: 2,
      drawPoints: 0,
      lossPoints: 1,
      tiebreakers: BASKETBALL_TIEBREAKERS,
    },
    match: {
      allowDraws: false,
      hasExtraTime: false,
      hasPenalties: false,
      hasOvertime: true,
    },
  },
  padel: {
    sport: "padel",
    standings: {
      winPoints: 2,
      drawPoints: 0,
      lossPoints: 0,
      tiebreakers: ["points", "wins"],
    },
    match: {
      allowDraws: false,
      hasExtraTime: false,
      hasPenalties: false,
      hasOvertime: false,
    },
  },
};

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.trunc(value);
  return normalized >= 0 ? normalized : fallback;
}

function toTiebreakers(value: unknown, fallback: SeasonTiebreaker[]): SeasonTiebreaker[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is SeasonTiebreaker => VALID_TIEBREAKERS.has(entry as SeasonTiebreaker));

  return normalized.length > 0 ? normalized : [...fallback];
}

export function normalizeSeasonRuleset(
  input?: Partial<SeasonRuleset> | Record<string, unknown> | null,
  fallbackSport = "generic",
): SeasonRuleset {
  const sport = toStringValue(input?.sport, fallbackSport);
  const basePreset = PRESET_RULESETS[sport] ?? PRESET_RULESETS.generic;
  const standings = input?.standings as Record<string, unknown> | undefined;
  const match = input?.match as Record<string, unknown> | undefined;

  return {
    sport: basePreset.sport,
    standings: {
      winPoints: toNonNegativeInteger(standings?.winPoints, basePreset.standings.winPoints),
      drawPoints: toNonNegativeInteger(standings?.drawPoints, basePreset.standings.drawPoints),
      lossPoints: toNonNegativeInteger(standings?.lossPoints, basePreset.standings.lossPoints),
      tiebreakers: toTiebreakers(standings?.tiebreakers, basePreset.standings.tiebreakers),
    },
    match: {
      allowDraws: toBooleanValue(match?.allowDraws, basePreset.match.allowDraws),
      hasExtraTime: toBooleanValue(match?.hasExtraTime, basePreset.match.hasExtraTime),
      hasPenalties: toBooleanValue(match?.hasPenalties, basePreset.match.hasPenalties),
      hasOvertime: toBooleanValue(match?.hasOvertime, basePreset.match.hasOvertime),
    },
  };
}

export function getSeasonRuleset(
  ruleset?: Partial<SeasonRuleset> | Record<string, unknown> | null,
): SeasonRuleset {
  return normalizeSeasonRuleset(ruleset);
}
