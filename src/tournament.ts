import type { Match, Team, TournamentConfig, Zone } from './types';

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function suggestedConfig(teamCount: number): TournamentConfig {
  if (teamCount <= 4) return { zones: 1, teamsPerZone: Math.max(2, teamCount) };

  const candidates: Array<TournamentConfig & { score: number }> = [];
  for (let zones = 1; zones <= Math.min(12, teamCount); zones++) {
    if (teamCount % zones !== 0) continue;
    const teamsPerZone = teamCount / zones;
    if (teamsPerZone < 2 || teamsPerZone > 32) continue;

    // Prioriza zonas de 4 a 8 parejas y evita generar demasiadas zonas de solo 2.
    const sizeScore = Math.abs(teamsPerZone - 4) * 2.4;
    const zoneScore = Math.abs(zones - 4) * 0.25;
    const tinyZonePenalty = teamsPerZone === 2 ? 4 : 0;
    candidates.push({ zones, teamsPerZone, score: sizeScore + zoneScore + tinyZonePenalty });
  }

  const best = candidates.sort((a, b) => a.score - b.score)[0];
  return best ? { zones: best.zones, teamsPerZone: best.teamsPerZone } : { zones: 1, teamsPerZone: teamCount };
}

function nextPowerOfTwo(value: number) {
  return 2 ** Math.ceil(Math.log2(Math.max(value, 2)));
}

type LabelFactory = (roundIndex: number, matchIndex: number, matchCount: number, roundCount: number) => string;

function resolveRoundFromPrevious(rounds: Match[][], roundIndex: number) {
  const previous = rounds[roundIndex - 1];
  const current = rounds[roundIndex];

  current.forEach((match, matchIndex) => {
    const leftFeeder = previous[matchIndex * 2];
    const rightFeeder = previous[matchIndex * 2 + 1];
    const leftResolved = leftFeeder.status === 'finished';
    const rightResolved = rightFeeder.status === 'finished';

    match.teamA = leftResolved ? leftFeeder.winner : undefined;
    match.teamB = rightResolved ? rightFeeder.winner : undefined;

    if (!leftResolved || !rightResolved) {
      match.winner = undefined;
      match.status = 'pending';
      return;
    }

    if (match.teamA && match.teamB) {
      const preservedWinner = match.winner && (match.winner.id === match.teamA.id || match.winner.id === match.teamB.id)
        ? match.winner
        : undefined;
      match.winner = preservedWinner;
      match.status = preservedWinner ? 'finished' : 'ready';
      return;
    }

    match.winner = match.teamA ?? match.teamB;
    match.status = 'finished';
  });
}

function buildElimination(teams: Team[], idPrefix: string, labelFactory: LabelFactory): Match[][] {
  if (teams.length < 2) return [];

  const bracketSize = nextPowerOfTwo(teams.length);
  const roundCount = Math.log2(bracketSize);
  const rounds: Match[][] = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
    const matchCount = bracketSize / 2 ** (roundIndex + 1);
    rounds.push(Array.from({ length: matchCount }, (_, matchIndex): Match => ({
      id: `${idPrefix}-r${roundIndex + 1}-m${matchIndex + 1}`,
      label: labelFactory(roundIndex, matchIndex, matchCount, roundCount),
      status: 'pending',
    })));
  }

  const seeds: Array<Team | undefined> = [...teams, ...Array.from({ length: bracketSize - teams.length }, () => undefined)];
  rounds[0].forEach((match, index) => {
    match.teamA = seeds[index * 2];
    match.teamB = seeds[index * 2 + 1];
    if (match.teamA && match.teamB) {
      match.status = 'ready';
    } else {
      match.winner = match.teamA ?? match.teamB;
      match.status = 'finished';
    }
  });

  for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
    resolveRoundFromPrevious(rounds, roundIndex);
  }

  return rounds;
}

export function createZones(teams: Team[], config: TournamentConfig): Zone[] {
  const randomized = shuffle(teams);
  return Array.from({ length: config.zones }, (_, zoneIndex) => {
    const zoneTeams = randomized.slice(
      zoneIndex * config.teamsPerZone,
      (zoneIndex + 1) * config.teamsPerZone,
    );
    const zoneLetter = String.fromCharCode(65 + zoneIndex);
    const rounds = buildElimination(zoneTeams, `z${zoneIndex + 1}`, (roundIndex, matchIndex, matchCount, roundCount) => {
      if (roundIndex === 0 && roundCount === 1) return `Mesa ${matchIndex + 1} · Final Zona ${zoneLetter}`;
      if (roundIndex === 0) return `Mesa ${matchIndex + 1}`;
      if (roundIndex === roundCount - 1) return `Final Zona ${zoneLetter}`;
      if (matchCount === 2) return `Semifinal ${matchIndex + 1}`;
      return `Ronda ${roundIndex + 1} · Partido ${matchIndex + 1}`;
    });

    return {
      id: `zone-${zoneIndex + 1}`,
      name: `Zona ${zoneLetter}`,
      teams: zoneTeams,
      rounds,
    };
  });
}

export function advanceMatch(rounds: Match[][], roundIndex: number, matchIndex: number, team: Team): Match[][] {
  const next = rounds.map(round => round.map(match => ({ ...match })));
  const match = next[roundIndex]?.[matchIndex];
  if (!match || match.winner || match.status !== 'ready' || (match.teamA?.id !== team.id && match.teamB?.id !== team.id)) return next;

  match.winner = team;
  match.status = 'finished';

  for (let nextRoundIndex = roundIndex + 1; nextRoundIndex < next.length; nextRoundIndex++) {
    resolveRoundFromPrevious(next, nextRoundIndex);
  }

  return next;
}

export function buildKnockout(champions: Team[]): Match[][] {
  return buildElimination(champions, 'ko', (roundIndex, matchIndex, matchCount, roundCount) => {
    if (roundIndex === roundCount - 1) return 'Gran final';
    if (matchCount === 2) return `Semifinal ${matchIndex + 1}`;
    return `Cruce ${matchIndex + 1}`;
  });
}
