import type Match from "./match"
import type PlayerStats from "./player-stats"

type User = {
  id: number,
  name: string,
  stats: Record<string, PlayerStats>,
  history: Match[]
}

export default User
