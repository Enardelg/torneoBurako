import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  Crown,
  Download,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import * as XLSX from 'xlsx';
import BallMachine3D from './components/BallMachine3D';
import { mockTeams } from './mockData';
import codeCoffeeLogo from '../logo.jpg';
import { advanceMatch, buildKnockout, createZones, suggestedConfig } from './tournament';
import type { Match, Team, TournamentConfig, TournamentPhase, Zone } from './types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type SoundCue = 'spin' | 'reveal' | 'advance' | 'complete' | 'champion';

type ConnectorPath = {
  id: string;
  d: string;
};

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function readCell(row: Record<string, unknown>, aliases: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const alias of aliases) {
    const value = normalized.get(normalizeHeader(alias));
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return '';
}

function useTournamentSound() {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (!contextRef.current) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      contextRef.current = new AudioContextClass();
    }
    if (contextRef.current.state === 'suspended') await contextRef.current.resume();
  }, []);

  const play = useCallback((cue: SoundCue) => {
    if (!enabledRef.current) return;
    const context = contextRef.current;
    if (!context || context.state !== 'running') return;

    const patterns: Record<SoundCue, Array<[number, number, number, OscillatorType]>> = {
      spin: [[220, 0, 0.09, 'sine'], [280, 0.08, 0.09, 'triangle']],
      reveal: [[440, 0, 0.12, 'sine'], [659, 0.1, 0.16, 'triangle'], [880, 0.23, 0.2, 'sine']],
      advance: [[392, 0, 0.12, 'triangle'], [523, 0.1, 0.18, 'sine']],
      complete: [[523, 0, 0.14, 'triangle'], [659, 0.12, 0.14, 'triangle'], [784, 0.24, 0.24, 'sine']],
      champion: [[392, 0, 0.18, 'triangle'], [523, 0.15, 0.18, 'triangle'], [659, 0.3, 0.22, 'sine'], [1047, 0.48, 0.5, 'sine']],
    };

    const now = context.currentTime;
    patterns[cue].forEach(([frequency, offset, duration, type]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(cue === 'champion' ? 0.07 : 0.045, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + duration + 0.03);
    });
  }, []);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      await unlock();
      requestAnimationFrame(() => play('advance'));
    }
  }, [enabled, play, unlock]);

  return { enabled, play, toggle, unlock };
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await document.documentElement.requestFullscreen?.();
    } catch {
      // Some embedded browsers or presentation shells can deny Fullscreen API requests.
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

function TeamLine({ team, winner, selectable, onSelect, label }: { team?: Team; winner?: boolean; selectable?: boolean; onSelect?: () => void; label?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      layout
      initial={false}
      animate={winner ? { scale: [1, 1.012, 1], y: [0, -1, 0] } : selectable ? { y: [0, -1, 0] } : { scale: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0.16 } : { duration: 0.28, ease: 'easeOut' }}
      whileHover={selectable && !reducedMotion ? { y: -2, scale: 1.01 } : undefined}
      className={`team-line ${winner ? 'winner' : ''} ${selectable ? 'selectable' : ''}`}
      onClick={onSelect}
      disabled={!selectable}
    >
      <span className="team-seed">{team?.seed ? String(team.seed).padStart(2, '0') : '—'}</span>
      <span className="team-copy"><strong>{team?.name ?? 'Por definir'}</strong><small>{team ? team.players.join(' · ') : 'Esperando resultado'}</small></span>
      {winner ? <Crown size={17} /> : label ? <span className="team-badge">{label}</span> : null}
    </motion.button>
  );
}

function DrawSlot({ team, visible, active }: { team?: Team; visible: boolean; active: boolean }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`slot draw-slot ${active ? 'receiving' : ''}`}>
      <AnimatePresence mode="wait" initial={false}>
        {visible && team ? (
          <motion.span
            key={team.id}
            className="draw-slot-name"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -18, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 14 }}
            transition={reducedMotion ? { duration: 0.14 } : { type: 'spring', stiffness: 260, damping: 22 }}
          >
            <CheckCircle2 size={15} />
            {team.name}
          </motion.span>
        ) : (
          <motion.span key="waiting" className="draw-slot-waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Esperando sorteo</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function ZoneBoard({ zone, activeTeamId, revealedTeamIds }: { zone: Zone; activeTeamId?: string; revealedTeamIds: Set<string> }) {
  const isReceiving = Boolean(activeTeamId);
  const visibleCount = zone.teams.filter(team => revealedTeamIds.has(team.id)).length;
  const openingRound = zone.rounds[0] ?? [];

  return (
    <motion.article
      layout
      className={`zone-board ${isReceiving ? 'zone-board-active' : ''}`}
      animate={isReceiving ? { y: [0, -3, 0] } : { y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <header><span>{zone.name}</span><small>{visibleCount}/{zone.teams.length} asignadas</small></header>
      {isReceiving && (
        <motion.div
          className="zone-route"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: [0.16, 0.92, 0.24], scaleX: [0.84, 1.04, 0.95] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="zone-flow">
        <div className="zone-opening">
          {openingRound.map(match => (
            <div className="fixture-box" key={match.id}>
              <b>{match.label}</b>
              <DrawSlot team={match.teamA} visible={Boolean(match.teamA && revealedTeamIds.has(match.teamA.id))} active={activeTeamId === match.teamA?.id} />
              <DrawSlot team={match.teamB} visible={Boolean(match.teamB && revealedTeamIds.has(match.teamB.id))} active={activeTeamId === match.teamB?.id} />
            </div>
          ))}
        </div>
        <div className="flow-arrow">➜</div>
        <div className="fixture-box zone-final-box">
          <b>{zone.rounds.length > 1 ? 'Ruta eliminatoria' : 'Definición de zona'}</b>
          <div className="slot">{zone.rounds.length > 1 ? `${zone.rounds.length - 1} fase${zone.rounds.length - 1 === 1 ? '' : 's'} restante${zone.rounds.length - 1 === 1 ? '' : 's'}` : 'Ganador de la mesa'}</div>
          <div className="slot">Clasifica al cuadro final</div>
        </div>
        <div className="flow-arrow">➜</div>
        <div className="zone-champion-mini"><Trophy size={20}/><span>Campeón</span><strong>{zone.name}</strong></div>
      </div>
    </motion.article>
  );
}

function Setup({ teams, setTeams, config, setConfig, onStart }: {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  config: TournamentConfig;
  setConfig: (config: TournamentConfig) => void;
  onStart: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState('');
  const capacity = config.zones * config.teamsPerZone;

  async function importExcel(file: File) {
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      const parsed = rows.map((row, index): Team => ({
        id: `excel-${index + 1}-${Date.now()}`,
        name: readCell(row, ['Pareja', 'Equipo', 'Nombre de pareja']) || `Pareja ${index + 1}`,
        players: [
          readCell(row, ['Jugador 1', 'Nombre 1', 'Jugador1', 'Integrante 1']),
          readCell(row, ['Jugador 2', 'Nombre 2', 'Jugador2', 'Integrante 2']),
        ],
        seed: index + 1,
      })).filter(team => team.players[0] && team.players[1]);

      if (!parsed.length) {
        setImportMessage('No se encontraron filas válidas. Revisá los encabezados y que ambos jugadores tengan nombre.');
        return;
      }

      setTeams(parsed);
      setConfig(suggestedConfig(parsed.length));
      setImportMessage(`Se importaron ${parsed.length} parejas correctamente desde ${file.name}.`);
    } catch {
      setImportMessage('No se pudo leer el archivo. Usá XLSX, XLS o CSV con la estructura indicada.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const data = [
      { Pareja: 'Los Cafeteros', 'Jugador 1': 'Ana Pérez', 'Jugador 2': 'Luis Gómez' },
      { Pareja: 'Doble Canasta', 'Jugador 1': 'María Díaz', 'Jugador 2': 'Carlos Ruiz' },
    ];
    const sheet = XLSX.utils.json_to_sheet(data, { header: ['Pareja', 'Jugador 1', 'Jugador 2'] });
    sheet['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 24 }];
    const instructions = XLSX.utils.aoa_to_sheet([
      ['INSTRUCCIONES DE IMPORTACIÓN'],
      ['Una fila representa una pareja.'],
      ['Columnas obligatorias', 'Jugador 1', 'Jugador 2'],
      ['Columna opcional', 'Pareja (si está vacía se genera Pareja 1, Pareja 2, etc.)'],
      ['No usar filas combinadas, subtítulos ni totales dentro de la tabla.'],
      ['La aplicación lee la primera hoja del archivo.'],
    ]);
    instructions['!cols'] = [{ wch: 34 }, { wch: 34 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Parejas');
    XLSX.utils.book_append_sheet(workbook, instructions, 'Cómo cargar');
    XLSX.writeFile(workbook, 'plantilla-parejas-burako-code-coffee.xlsx');
  }

  return (
    <motion.section className="screen setup-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="setup-copy">
        <div className="brand-hero">
          <img className="brand-logo brand-logo-hero" src={codeCoffeeLogo} alt="Code Coffee" />
          <div className="eyebrow"><Sparkles size={15}/> FORMATO ELIMINACIÓN POR ZONAS</div>
        </div>
        <h1>Fixture de<br/><span>Burako</span></h1>
        <p>Configuración flexible por zonas, sorteo escénico y cuadro tipo Mundial en una única experiencia de presentación.</p>
        <div className="config-panel">
          <label>Zonas<input type="number" min="1" max="12" value={config.zones} onChange={e => setConfig({ ...config, zones: Math.max(1, Number(e.target.value)) })}/></label>
          <label>Parejas por zona<input type="number" min="2" max="32" step="1" value={config.teamsPerZone} onChange={e => setConfig({ ...config, teamsPerZone: Math.max(2, Number(e.target.value)) })}/></label>
          <div className={capacity === teams.length ? 'capacity ok' : 'capacity warning'}><strong>{capacity}</strong><span>cupos configurados</span></div>
        </div>
        {capacity !== teams.length && <p className="setup-warning">La configuración debe contener exactamente {teams.length} parejas. Sugerencia: {suggestedConfig(teams.length).zones} zonas de {suggestedConfig(teams.length).teamsPerZone}.</p>}
        <div className="hero-actions">
          <button className="primary" disabled={capacity !== teams.length} onClick={onStart}><Play size={18} fill="currentColor"/> Iniciar sorteo por zonas</button>
          <button className="secondary" onClick={() => inputRef.current?.click()}><FileSpreadsheet size={18}/> Importar Excel</button>
          <button className="secondary" onClick={downloadTemplate}><Download size={18}/> Descargar plantilla</button>
          <input ref={inputRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && importExcel(e.target.files[0])}/>
        </div>
        {importMessage && <div className="import-message" role="status">{importMessage}</div>}
        <details className="excel-guide">
          <summary>¿Cómo debe estar armado el Excel?</summary>
          <div>
            <p>La primera fila debe contener los encabezados <strong>Pareja</strong>, <strong>Jugador 1</strong> y <strong>Jugador 2</strong>. Cada fila siguiente representa una pareja.</p>
            <p><strong>Jugador 1</strong> y <strong>Jugador 2</strong> son obligatorios. <strong>Pareja</strong> es opcional. No uses celdas combinadas, títulos arriba de la tabla ni filas de totales.</p>
          </div>
        </details>
        <div className="stats"><div><strong>{teams.length * 2}</strong><span>participantes</span></div><div><strong>{teams.length}</strong><span>parejas</span></div><div><strong>{config.zones}</strong><span>zonas</span></div></div>
      </div>
      <BallMachine3D active />
    </motion.section>
  );
}

function DrawScreen({ zones, onComplete, playSound }: { zones: Zone[]; onComplete: () => void; playSound: (cue: SoundCue) => void }) {
  const sequence = useMemo(() => {
    const maxTeamsInZone = Math.max(0, ...zones.map(zone => zone.teams.length));
    const drawOrder: { zoneId: string; team: Team }[] = [];

    // Reparte visualmente una pareja por zona en cada vuelta del bolillero.
    // La asignación sigue siendo aleatoria, pero la audiencia ve crecer todas las zonas en paralelo.
    for (let position = 0; position < maxTeamsInZone; position++) {
      zones.forEach(zone => {
        const team = zone.teams[position];
        if (team) drawOrder.push({ zoneId: zone.id, team });
      });
    }

    return drawOrder;
  }, [zones]);
  const [cursor, setCursor] = useState(-1);
  const [spinning, setSpinning] = useState(true);
  const [revealed, setRevealed] = useState<Team>();
  const reducedMotion = useReducedMotion();
  const drawRunId = useRef(0);

  useEffect(() => {
    // React.StrictMode ejecuta el efecto, lo limpia y lo vuelve a ejecutar en desarrollo.
    // El bloqueo anterior con `running.current` cancelaba la primera ejecución y luego
    // impedía que la segunda arrancara, dejando el bolillero girando para siempre.
    // Cada ejecución recibe ahora un identificador propio; solo la más reciente puede
    // modificar el sorteo o completar la pantalla.
    const runId = ++drawRunId.current;
    let cancelled = false;
    const isStale = () => cancelled || drawRunId.current !== runId;

    setCursor(-1);
    setSpinning(true);
    setRevealed(undefined);

    (async () => {
      for (let i = 0; i < sequence.length; i++) {
        if (isStale()) return;
        setSpinning(true);
        setRevealed(undefined);
        playSound('spin');

        await wait(reducedMotion ? 360 : 850);
        if (isStale()) return;

        setCursor(i);
        setSpinning(false);
        setRevealed(sequence[i].team);
        playSound('reveal');

        await wait(reducedMotion ? 620 : 1050);
      }

      if (isStale()) return;
      playSound('complete');
      await wait(reducedMotion ? 260 : 600);
      if (!isStale()) onComplete();
    })();

    return () => {
      cancelled = true;
    };
  }, [sequence, onComplete, reducedMotion, playSound]);

  const current = cursor >= 0 ? sequence[cursor] : undefined;
  const currentZone = current ? zones.find(zone => zone.id === current.zoneId) : undefined;
  const revealedTeamIds = useMemo(() => new Set(sequence.slice(0, cursor + 1).map(item => item.team.id)), [cursor, sequence]);

  return (
    <section className="screen draw-world-screen">
      <div className="draw-topbar"><div><small>SORTEO EN VIVO</small><h2>Asignación de parejas por zonas</h2></div><div className="live-pill"><span/> EN VIVO</div></div>
      <div className="draw-world-layout">
        <div className="draw-stage-fixed">
          <motion.div className="ambient-glow" initial={{ opacity: 0.2 }} animate={{ opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 2.6, repeat: Infinity }} />
          <BallMachine3D active={spinning}/>
          <div className="draw-result-card" aria-live="polite">
            <motion.div
              className="reveal-beam"
              initial={false}
              animate={spinning ? { x: ['-16%', '116%'], opacity: [0.2, 0.95, 0.2] } : { x: 0, opacity: 0.7 }}
              transition={reducedMotion ? { duration: 0.12 } : { duration: 0.72, repeat: spinning ? Infinity : 0, ease: 'easeInOut' }}
            />
            <AnimatePresence mode="wait">
              <motion.div className="reveal-content" key={revealed?.id ?? 'waiting'} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: reducedMotion ? 0.16 : 0.3 }}>
                <small>{spinning ? 'BOLILLERO EN MOVIMIENTO' : currentZone ? `ASIGNADA A ${currentZone.name.toUpperCase()}` : 'PREPARANDO SORTEO'}</small>
                <strong>{revealed?.name ?? 'Próxima pareja…'}</strong>
                <span>{revealed?.players.join(' & ') ?? 'La asignación aparecerá aquí'}</span>
                <motion.em key={currentZone?.id ?? 'pending'} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }}>{currentZone?.name ?? 'Zona pendiente'}</motion.em>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="fixture-live-board">
          {zones.map(zone => <ZoneBoard key={zone.id} zone={zone} revealedTeamIds={revealedTeamIds} activeTeamId={current?.zoneId === zone.id && revealed ? revealed.id : undefined}/>) }
        </div>
      </div>
      <div className="draw-progress"><span style={{ width: `${((cursor + 1) / Math.max(sequence.length, 1)) * 100}%` }}/></div>
    </section>
  );
}

function ZoneResultBoard({ zone, onChoose }: { zone: Zone; onChoose: (roundIndex: number, matchIndex: number, team: Team) => void }) {
  const reducedMotion = useReducedMotion();
  const bracketRef = useRef<HTMLDivElement>(null);
  const revision = zone.rounds.map(round => round.map(match => `${match.id}:${match.winner?.id ?? ''}`).join('|')).join('>');
  const crownNodeId = `${zone.id}-crown`;

  return (
    <article className={`zone-result-card ${zone.champion ? 'zone-result-card-active' : ''}`}>
      <header><h3>{zone.name}</h3><span>{zone.champion ? 'CAMPEÓN DEFINIDO' : 'EN JUEGO'}</span></header>
      <div className="zone-bracket-scroll">
        <div
          className="zone-bracket"
          ref={bracketRef}
          style={{ '--zone-round-count': zone.rounds.length, '--zone-bracket-min-width': `${160 + zone.rounds.length * 250}px` } as CSSProperties}
        >
          <BracketConnectors bracketRef={bracketRef} revision={revision} idPrefix={zone.id}/>
          {zone.rounds.map((round, roundIndex) => (
            <div className="zone-round" key={roundIndex}>
              <h4>{roundIndex === zone.rounds.length - 1 ? 'FINAL DE ZONA' : roundIndex === 0 ? 'MESAS' : round.length === 2 ? 'SEMIFINALES' : `RONDA ${roundIndex + 1}`}</h4>
              <div className="zone-round-matches">
                {round.map((match, matchIndex) => {
                  const target = roundIndex === zone.rounds.length - 1 ? crownNodeId : zone.rounds[roundIndex + 1]?.[Math.floor(matchIndex / 2)]?.id;
                  return (
                    <motion.div
                      className={`result-match zone-bracket-match ${match.winner ? 'winner-match' : ''}`}
                      data-bracket-node={match.id}
                      data-bracket-target={target}
                      layout={!reducedMotion}
                      key={match.id}
                    >
                      <b>{match.label}</b>
                      <TeamLine team={match.teamA} winner={match.winner?.id === match.teamA?.id} selectable={match.status === 'ready' && !match.winner} onSelect={() => match.teamA && onChoose(roundIndex, matchIndex, match.teamA)} label={match.winner?.id === match.teamA?.id ? (roundIndex === zone.rounds.length - 1 ? 'CAMPEÓN' : 'CLASIFICADO') : undefined}/>
                      <div className="match-vs">VS</div>
                      <TeamLine team={match.teamB} winner={match.winner?.id === match.teamB?.id} selectable={match.status === 'ready' && !match.winner} onSelect={() => match.teamB && onChoose(roundIndex, matchIndex, match.teamB)} label={match.winner?.id === match.teamB?.id ? (roundIndex === zone.rounds.length - 1 ? 'CAMPEÓN' : 'CLASIFICADO') : undefined}/>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          <motion.div className={`zone-crown-card zone-bracket-crown ${zone.champion ? 'active' : ''}`} data-bracket-node={crownNodeId} animate={zone.champion ? { scale: [1, 1.05, 1] } : {}}><Trophy/><small>CAMPEÓN DE ZONA</small><strong>{zone.champion?.name ?? 'Por definir'}</strong></motion.div>
        </div>
      </div>
    </article>
  );
}

function ZonesScreen({ zones, setZones, onContinue, playSound }: { zones: Zone[]; setZones: (zones: Zone[]) => void; onContinue: () => void; playSound: (cue: SoundCue) => void }) {
  function chooseZoneWinner(zoneId: string, roundIndex: number, matchIndex: number, team: Team) {
    const selectedZone = zones.find(zone => zone.id === zoneId);
    if (!selectedZone) return;
    const isZoneFinal = roundIndex === selectedZone.rounds.length - 1;
    playSound(isZoneFinal ? 'complete' : 'advance');
    setZones(zones.map(zone => {
      if (zone.id !== zoneId) return zone;
      const rounds = advanceMatch(zone.rounds, roundIndex, matchIndex, team);
      return { ...zone, rounds, champion: isZoneFinal ? team : zone.champion };
    }));
  }

  const complete = zones.length > 0 && zones.every(zone => zone.champion);
  return (
    <section className="screen zones-screen">
      <div className="section-heading"><div><div className="eyebrow">CONTROL DE RESULTADOS</div><h2>Finales por zona</h2><p>Seleccioná cada ganador. El cuadro adapta automáticamente sus rondas y conectores a la cantidad de parejas.</p></div><button className="primary" disabled={!complete} onClick={onContinue}><Trophy size={18}/> Habilitar fase final</button></div>
      <div className="zone-results-grid">
        {zones.map(zone => <ZoneResultBoard key={zone.id} zone={zone} onChoose={(roundIndex, matchIndex, team) => chooseZoneWinner(zone.id, roundIndex, matchIndex, team)}/>) }
      </div>
    </section>
  );
}

function BracketConnectors({ bracketRef, revision, idPrefix }: { bracketRef: RefObject<HTMLDivElement | null>; revision: unknown; idPrefix: string }) {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [size, setSize] = useState({ width: 1, height: 1 });

  useLayoutEffect(() => {
    const bracket = bracketRef.current;
    if (!bracket) return;

    let frame = 0;
    const calculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const containerRect = bracket.getBoundingClientRect();
        const nodes = Array.from(bracket.querySelectorAll<HTMLElement>('[data-bracket-target]'));
        const nextPaths = nodes.flatMap(node => {
          const targetId = node.dataset.bracketTarget;
          if (!targetId) return [];
          const target = bracket.querySelector<HTMLElement>(`[data-bracket-node="${targetId}"]`);
          if (!target) return [];
          const sourceRect = node.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const startX = sourceRect.right - containerRect.left;
          const startY = sourceRect.top - containerRect.top + sourceRect.height / 2;
          const endX = targetRect.left - containerRect.left;
          const endY = targetRect.top - containerRect.top + targetRect.height / 2;
          const middleX = startX + Math.max(18, (endX - startX) * 0.5);
          return [{
            id: `${node.dataset.bracketNode}-${targetId}`,
            d: `M ${startX} ${startY} H ${middleX} V ${endY} H ${Math.max(middleX, endX - 8)}`,
          }];
        });
        setSize({ width: Math.max(bracket.clientWidth, 1), height: Math.max(bracket.clientHeight, 1) });
        setPaths(nextPaths);
      });
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(bracket);
    bracket.querySelectorAll<HTMLElement>('[data-bracket-node]').forEach(node => observer.observe(node));
    window.addEventListener('resize', calculate);
    document.fonts?.ready.then(calculate).catch(() => undefined);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', calculate);
    };
  }, [bracketRef, revision]);

  const gradientId = `${idPrefix}-gradient`;
  const markerId = `${idPrefix}-arrow`;

  return (
    <svg className="bracket-connectors" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1"><stop offset="0" stopColor="var(--magenta)"/><stop offset="1" stopColor="var(--cyan)"/></linearGradient>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--cyan)"/></marker>
      </defs>
      {paths.map(path => <motion.path key={path.id} d={path.d} stroke={`url(#${gradientId})`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: .42 }} markerEnd={`url(#${markerId})`}/>)}
    </svg>
  );
}

function Playoffs({ champions, onChampion, playSound }: { champions: Team[]; onChampion: (team: Team) => void; playSound: (cue: SoundCue) => void }) {
  const [rounds, setRounds] = useState<Match[][]>(() => buildKnockout(champions));
  const reducedMotion = useReducedMotion();
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (champions.length === 1) onChampion(champions[0]);
  }, [champions, onChampion]);

  function choose(roundIndex: number, matchIndex: number, team: Team) {
    const isFinal = roundIndex === rounds.length - 1;
    if (!isFinal) playSound('advance');
    setRounds(current => {
      const next = advanceMatch(current, roundIndex, matchIndex, team);
      if (isFinal && next[roundIndex]?.[matchIndex]?.winner?.id === team.id) {
        queueMicrotask(() => onChampion(team));
      }
      return next;
    });
  }

  const revision = rounds.map(round => round.map(match => `${match.id}:${match.winner?.id ?? ''}`).join('|')).join('>');

  return (
    <section className="screen playoffs-screen">
      <div className="section-heading"><div><div className="eyebrow">FASE FINAL</div><h2>Camino al campeonato</h2><p>Fixture visual tipo Mundial con conectores alineados dinámicamente entre cada resultado.</p></div></div>
      <div className="world-bracket-scroll">
        <div className="world-bracket" ref={bracketRef} style={{ '--round-count': rounds.length, '--bracket-min-width': `${520 + rounds.length * 360}px` } as CSSProperties}>
          <BracketConnectors bracketRef={bracketRef} revision={revision} idPrefix="playoffs"/>
          <div className="champion-source-column">
            {champions.map((team, i) => {
              const target = rounds[0]?.[Math.floor(i / 2)]?.id;
              return <motion.div layout className="source-champion active" data-bracket-node={`source-${team.id}`} data-bracket-target={target} key={team.id}><Trophy size={18}/><small>CAMPEÓN ZONA {String.fromCharCode(65 + i)}</small><strong>{team.name}</strong></motion.div>;
            })}
          </div>
          {rounds.map((round, roundIndex) => (
            <div className="world-round" key={roundIndex}>
              <h3>{round.length === 1 ? 'GRAN FINAL' : round.length === 2 ? 'SEMIFINALES' : `RONDA ${roundIndex + 1}`}</h3>
              <div className="world-round-matches">
                {round.map((match, matchIndex) => {
                  const nextTarget = roundIndex === rounds.length - 1 ? 'trophy-destination' : rounds[roundIndex + 1]?.[Math.floor(matchIndex / 2)]?.id;
                  return (
                    <motion.article
                      className={`world-match ${match.winner ? 'winner-match' : ''}`}
                      data-bracket-node={match.id}
                      data-bracket-target={nextTarget}
                      layout={!reducedMotion}
                      initial={false}
                      animate={match.winner ? { scale: [1, 1.012, 1] } : { scale: 1 }}
                      transition={reducedMotion ? { duration: 0.16 } : { duration: 0.28, ease: 'easeOut' }}
                      key={match.id}
                    >
                      <b>{match.label}</b>
                      {match.winner && roundIndex < rounds.length - 1 ? <motion.span className="advancing-pill" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>AVANZA</motion.span> : null}
                      <TeamLine team={match.teamA} winner={match.winner?.id === match.teamA?.id} selectable={match.status === 'ready' && !match.winner} onSelect={() => match.teamA && choose(roundIndex, matchIndex, match.teamA)} label={match.winner?.id === match.teamA?.id ? (roundIndex === rounds.length - 1 ? 'CAMPEÓN' : 'CLASIFICADO') : undefined}/>
                      <div className="match-vs">VS</div>
                      <TeamLine team={match.teamB} winner={match.winner?.id === match.teamB?.id} selectable={match.status === 'ready' && !match.winner} onSelect={() => match.teamB && choose(roundIndex, matchIndex, match.teamB)} label={match.winner?.id === match.teamB?.id ? (roundIndex === rounds.length - 1 ? 'CAMPEÓN' : 'CLASIFICADO') : undefined}/>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="trophy-destination active" data-bracket-node="trophy-destination"><Trophy size={58}/><span>CAMPEÓN</span><small>DEL TORNEO</small></div>
        </div>
      </div>
    </section>
  );
}

function Champion({ team, onReset }: { team: Team; onReset: () => void }) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="screen champion-screen">
      <div className="spotlight-beam"/><div className="confetti">{Array.from({ length: 90 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>
      <motion.div className="champion-podium" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: .72, rotateY: -18 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}>
        <motion.div className="trophy-orbit" animate={reducedMotion ? {} : { y: [0, -12, 0], rotateY: [0, 10, 0], scale: [1, 1.04, 1] }} transition={{ duration: 3.2, repeat: Infinity }}><Trophy size={118}/></motion.div>
        <div className="champion-kicker">CAMPEONES DEL TORNEO</div><h1>{team.name}</h1><p>{team.players.join(' & ')}</p>
        <div className="champion-ribbon"><Crown/> CAMPEONES DE BURAKO <Crown/></div>
        <button className="secondary" onClick={onReset}><RotateCcw size={17}/> Crear nuevo torneo</button>
      </motion.div>
    </section>
  );
}

export default function App() {
  const [phase, setPhase] = useState<TournamentPhase>('setup');
  const [teams, setTeams] = useState<Team[]>(mockTeams.slice(0, 16));
  const [config, setConfig] = useState<TournamentConfig>({ zones: 4, teamsPerZone: 4 });
  const [zones, setZones] = useState<Zone[]>([]);
  const [champion, setChampion] = useState<Team>();
  const { enabled: soundEnabled, play: playSound, toggle: toggleSound, unlock: unlockSound } = useTournamentSound();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const begin = useCallback(async () => {
    await unlockSound();
    setZones(createZones(teams, config));
    setPhase('draw');
  }, [config, teams, unlockSound]);

  const reset = useCallback(() => {
    setPhase('setup');
    setTeams(mockTeams.slice(0, 16));
    setConfig({ zones: 4, teamsPerZone: 4 });
    setZones([]);
    setChampion(undefined);
  }, []);

  const finishTournament = useCallback((team: Team) => {
    playSound('champion');
    setChampion(team);
    setPhase('champion');
  }, [playSound]);

  // Las callbacks estables evitan reiniciar el temporizador del sorteo cuando el
  // usuario activa/desactiva sonido o entra/sale de pantalla completa.
  const finishDraw = useCallback(() => setPhase('zones'), []);
  const continueToPlayoffs = useCallback(() => setPhase('playoffs'), []);

  return <main className="app-shell"><div className="texture"/><nav><div className="brand"><img className="brand-logo" src={codeCoffeeLogo} alt="Code Coffee" /><div><strong>BURAKO</strong><span>FIXTURE POR ZONAS</span></div></div><div className="nav-actions"><span><Users size={16}/>{teams.length * 2} participantes</span><button title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'} aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'} aria-pressed={soundEnabled} className={soundEnabled ? 'control-active' : ''} onClick={toggleSound}>{soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button><button title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} className={isFullscreen ? 'control-active' : ''} onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button></div></nav><AnimatePresence mode="wait">
    {phase === 'setup' && <Setup key="setup" teams={teams} setTeams={setTeams} config={config} setConfig={setConfig} onStart={begin}/>} 
    {phase === 'draw' && <DrawScreen key="draw" zones={zones} playSound={playSound} onComplete={finishDraw}/>} 
    {phase === 'zones' && <ZonesScreen key="zones" zones={zones} setZones={setZones} playSound={playSound} onContinue={continueToPlayoffs}/>} 
    {phase === 'playoffs' && <Playoffs key="playoffs" champions={zones.map(zone => zone.champion!).filter(Boolean)} playSound={playSound} onChampion={finishTournament}/>} 
    {phase === 'champion' && champion && <Champion key="champion" team={champion} onReset={reset}/>} 
  </AnimatePresence></main>;
}
