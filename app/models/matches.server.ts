import * as csv from "fast-csv";
import * as fs from "fs";
import * as path from "path";
import { flatten, isEmpty, isNil } from "ramda";
import type { RawMatchData } from "./entities/match";
import { MatchData, parseUserListString } from "./entities/match";
import type PlayerStats from "./entities/player-stats";
import type User from "./entities/user";

import Directory from "./entities/directory";

export async function loadResultsFromCsv(): Promise<RawMatchData[]> {
  return new Promise((resolve, reject) => {
    const output: any[] = [];
    fs.createReadStream(path.join(__dirname, "../results.csv"))
      .pipe(csv.parse({ headers: true }))
      .on("data", (data) => {
        output.push(data);
      })
      .on("end", () => {
        resolve(output);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export const stringToUser = (input: string): User => {
  const allUserNames = Object.keys(Directory.users);
  if (!allUserNames.includes(input)) {
    throw new Error(`User with name '${input}' not found`);
  }
  return Directory.users[input];
};

export function getGames(data: RawMatchData[]) {
  data.forEach((match) => {
    const game = match?.Game;
    if (isNil(game) || isEmpty(game)) return;
    Directory.addGame(match["Game"]);
  });
}

export function populateUsers(data: RawMatchData[]) {
  data.forEach((item: RawMatchData) => {
    const participants = parseUserListString(item["Participants"]);
    participants.forEach((name: string) => {
      const known = Object.keys(Directory.users);
      if (!isNil(name) && !isEmpty(name) && !known.includes(name)) {
        Directory.addUser({
          name,
          stats: {},
          history: [],
        });
      }
    });
  });
}

function getStatsForUser(
  matches: MatchData[],
  name: string,
  game: string
): PlayerStats {
  console.debug("getStatsForUser: ", name, game);

  const matchesForGame = matches.filter((match) => {
    const gameMatches = match.game === game;
    const participated = match.participants.map((x) => x?.name).includes(name);
    return gameMatches && participated;
  });

  console.debug("got matches for game");

  const matchesWon = matchesForGame.filter((match) => {
    return match.winners.map((x) => x?.name).includes(name);
  });

  console.debug("got matches won");

  const wins = matchesWon && matchesWon.length > 0 ? matchesWon.length : 0;
  const played = matchesForGame.length;
  return {
    game,
    wins,
    played,
    history: matchesForGame,
  };
}

export async function loadData(): Promise<{
  games: string[];
  users: Record<string, User>;
  matches: MatchData[];
}> {
  const raw = await loadResultsFromCsv();
  populateUsers(raw);
  getGames(raw);
  const matches: MatchData[] = raw
    .map((item) => {
      try {
        const data = new MatchData(item);
        return data;
      } catch (e) {
        console.error(e);
      }
    })
    .filter((x) => !isNil(x)) as MatchData[];
  const getStats = (user: string, game: string): PlayerStats =>
    getStatsForUser(matches, user, game);

  const names = Object.keys(Directory.users);

  console.log("processing users... names are: ", names);

  names.forEach((name) => {
    console.debug("processing results for user: ", name);

    const firstName = name.split(" ")[0];
    Directory.games.forEach((game: string) => {
      console.debug(`getting ${firstName}'s stats for ${game}`);
      const stats = getStats(name, game);
      console.debug(`${firstName}'s stats for ${game} are:`, stats);
      Directory.users[name].stats[game] = stats;
    });

    console.debug("finished generating game stats for user", name);

    // add all games summary
    const allGamesPlayed = Object.keys(Directory.users[name].stats).map(
      (game) => Directory.users[name].stats[game]
    );

    console.debug("all games played are: ", allGamesPlayed);

    const all = {
      game: "All",
      wins: allGamesPlayed.reduce((prev, cur) => prev + cur.wins, 0),
      played: allGamesPlayed.reduce((prev, cur) => prev + cur.played, 0),
      history: flatten(allGamesPlayed.map((game) => game.history)),
    };

    Directory.users[name].stats["All"] = all;
    console.debug("finished generating summary for user", name);
  });

  console.log("processed all users!");

  return {
    users: Directory.users,
  };
}
