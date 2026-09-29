export type Team = {
  id: string;
  name: string;
  players: [string, string];
  seed?: number;
};

export type Match = {
  id: string;
  label: string;
  teamA?: Team;
  teamB?: Team;
  winner?: Team;
  status: 'pending' | 'ready' | 'finished';
};

export type Zone = {
  id: string;
  name: string;
  teams: Team[];
  rounds: Match[][];
  champion?: Team;
};

export type TournamentConfig = {
  zones: number;
  teamsPerZone: number;
};

export type TournamentPhase = 'setup' | 'draw' | 'zones' | 'playoffs' | 'champion';
