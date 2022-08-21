import type { MatchData } from "./match";

export default class PlayerStats {
  readonly game: string;
  readonly wins: number;
  readonly played: number;
  readonly history: readonly MatchData[];

  constructor({
    game,
    wins,
    played,
    history,
  }: {
    game: string;
    wins: number;
    played: number;
    history: MatchData[];
  }) {
    this.game = game;
    this.wins = wins;
    this.played = played;
    this.history = history;
  }
}
