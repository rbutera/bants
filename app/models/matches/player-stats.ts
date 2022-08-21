import type { MatchData } from "./match"
export type PlayerStats = {
  game: string;
  wins: number;
  played: number;
  history: MatchData[];
};
