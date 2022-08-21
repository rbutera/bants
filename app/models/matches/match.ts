export class Match {
  readonly date: Date;
  readonly game: string;

  constructor(date: string, game: string) {
    this.date = new Date(date);
    this.game = game;
  }
}

export class MatchData extends Match {
  readonly participants: User[];
  readonly winners: User[];

  constructor(input: RawMatchData) {
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
}


export default Match
