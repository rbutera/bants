import * as csv from "fast-csv";
import * as fs from "fs";
import * as path from "path";
import { flatten, isEmpty, isNil } from "ramda";

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

export type PlayerStats = {
  game: string;
  wins: number;
  played: number;
  history: MatchData[];
};

export class Match {
  readonly date: Date;
  readonly game: string;

  constructor(date: string, game: string) {
    this.date = new Date(date);
    this.game = game;
  }
}

export type User = {
  id: number;
  name: string;
  stats: Record<string, PlayerStats>;
  history: Match[];
};

export type RawMatchData = {
  Date: string;
  "Date Recorded": string;
  Game: string;
  "Match ID": string;
  Participants: string;
  "Reported by": string;
  "Winner(s)": string;
};

export const Users: Record<string, User> = {};

export const Games: string[] = [];

export const Matches: MatchData[] = [];

export const stringToUser = (input: string): User => {
  const allUserNames = Object.keys(Users);
  if (!allUserNames.includes(input)) {
    throw new Error(`User with name '${input}' not found`);
  }
  return Users[input];
};

export class MatchData extends Match {
  readonly participants: User[];
  readonly winners: User[];

  constructor(input: RawMatchData) {
    super(input.Date, input.Game);
    this.winners = userListStringToUsers(input["Winner(s)"]);
    this.participants = userListStringToUsers(input["Participants"]);
  }
}

export function getGames(data: RawMatchData[]) {
  data.forEach((match) => {
    const game = match?.Game;
    if (isNil(game) || isEmpty(game)) return;
    if (!Games.includes(match["Game"])) {
      Games.push(match["Game"]);
    }
  });
}

function parseUserListString(input: string): string[] {
  return input.split(", ");
}

function userListStringToUsers(input: string): User[] {
  const userNames = parseUserListString(input);
  return userNames.map((userName) => {
    return Users[userName];
  });
}

export function generateUsers(data: RawMatchData[]) {
  data.forEach((item: RawMatchData) => {
    const participants = parseUserListString(item["Participants"]);
    participants.forEach((name: string) => {
      const knownUsers = Object.keys(Users);
      if (!isNil(name) && !isEmpty(name) && !knownUsers.includes(name)) {
        Users[name] = {
          id: Object.keys(Users).length,
          name,
          stats: {},
          history: [],
        };
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
    match.game === game;
    match.participants.map((x) => x?.name).includes(name);
  });

  console.debug("got matches for game");

  const matchesWon = matchesForGame.filter((match) => {
    match.winners.map((x) => x?.name).includes(name);
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
  generateUsers(raw);
  getGames(raw);
  const matches = raw.map((item) => new MatchData(item));
  const getStats = (user: string, game: string): PlayerStats =>
    getStatsForUser(matches, user, game);

  const names = Object.keys(Users);

  console.log("processing users... names are: ", names);

  names.forEach((name) => {
    console.debug("processing results for user: ", name);

    const firstName = name.split(" ")[0];
    Games.forEach((game) => {
      console.debug(`getting ${firstName}'s stats for ${game}`);
      const stats = getStats(name, game);
      console.debug(`${firstName}'s stats for ${game} are:`, stats);
      Users[name].stats[game] = stats;
    });

    console.debug("finished generating game stats for user", name);

    // add all games summary
    const allGamesPlayed = Object.keys(Users[name].stats).map(
      (game) => Users[name].stats[game]
    );

    console.debug("all games played are: ", allGamesPlayed);

    const all = {
      game: "All",
      wins: allGamesPlayed.reduce((prev, cur) => prev + cur.wins, 0),
      played: allGamesPlayed.reduce((prev, cur) => prev + cur.played, 0),
      history: flatten(allGamesPlayed.map((game) => game.history)),
    };

    Users[name].stats["All"] = all;
    console.debug("finished generating summary for user", name);
  });

  console.log("processed all users!");

  return {
    games: Games,
    users: Users,
    matches,
  };
}
