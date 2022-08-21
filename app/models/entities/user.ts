import { v4 as uuidv4 } from "uuid";
import type Match from "./match";
import type PlayerStats from "./player-stats";

export class User {
  id?: string;
  name: string;
  stats: Record<string, PlayerStats>;
  history: Match[];

  constructor({
    id,
    name,
    stats,
    history,
  }: {
    id?: string;
    name: string;
    stats: Record<string, PlayerStats>;
    history: Match[];
  }) {
    this.id = id ?? uuidv4();
    this.name = name;
    this.stats = stats;
    this.history = history;
  }
}

export default User;
