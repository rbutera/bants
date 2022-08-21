import type { MatchData } from "~/models/entities/match";
import type User from "~/models/entities/user";

export class DataDirectory {
  users: Record<string, User>;
  games: string[];
  matches: MatchData[];

  constructor() {
    this.users = {};
    this.games = [];
    this.matches = [];
  }

  addUser = (user: User) => {
    this.users[user.name] = user;
  };

  addGame = (game: string) => {
    if (!this.games.includes(game)) {
      this.games.push(game);
      this.games = this.games.sort();
    }
  };

  addMatch = (match: MatchData) => {
    this.matches.push(match);
  };
}

export const Directory = new DataDirectory();

export default Directory;
