import { format, parse } from "date-fns";
import { isEmpty, isNil } from "ramda";
import Directory from "./directory";
import type User from "./user";

export function parseUserListString(input: string): string[] {
  return input.split(", ");
}

function userListStringToUsers(input: string): User[] {
  const userNames = parseUserListString(input);
  return userNames.map((userName) => {
    return Directory.users[userName];
  });
}

export class Match {
  readonly date: Date;
  readonly game: string;

  constructor(date: string, game: string) {
    const dateFormat = "dd/MM/yyyy";
    console.warn("input date is ", date);
    this.date = parse(date, dateFormat, new Date());
    console.debug(
      `Match: input date is ${date} -> ${format(this.date, dateFormat)}`
    );
    this.game = game;
  }
}

export class MatchData extends Match {
  readonly participants: User[];
  readonly winners: User[];

  constructor(input: RawMatchData) {
    // validate data
    if (isNil(input)) {
      throw new Error("MatchData: input is null");
    }

    if (isNil(input.Date) || isEmpty(input.Date)) {
      throw new Error("MatchData: input.Date is null or empty");
    }

    super(input.Date, input.Game);
    this.winners = userListStringToUsers(input["Winner(s)"]);
    this.participants = userListStringToUsers(input["Participants"]);
  }
}

export type RawMatchData = {
  Date: string;
  "Date Recorded": string;
  Game: string;
  "Match ID": string;
  Participants: string;
  "Reported by": string;
  "Winner(s)": string;
};

export default Match;
