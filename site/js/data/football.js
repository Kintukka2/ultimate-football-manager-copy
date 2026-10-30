// The game's football: positions, lines, formations and sub-stats, as the
// Ultimate Football Manager 27 interface shows them to every player.

export const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

export const POSITION_NAMES = {
  GK: 'Goalkeeper', CB: 'Centre-back', LB: 'Left-back', RB: 'Right-back',
  CDM: 'Defensive midfielder', CM: 'Central midfielder', CAM: 'Attacking midfielder',
  LM: 'Left midfielder', RM: 'Right midfielder', LW: 'Left winger', RW: 'Right winger', ST: 'Striker',
};

// The team screen splits the eleven into ATT, MID and DEF. We count the
// goalkeeper with the defence; the game does not say how it does.
export const LINE = {
  GK: 'DEF', CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'ATT', RW: 'ATT', ST: 'ATT',
};

export const OUTFIELD_STATS = [
  { key: 'pac', label: 'PAC', name: 'Pace' },
  { key: 'sho', label: 'SHO', name: 'Shooting' },
  { key: 'pas', label: 'PAS', name: 'Passing' },
  { key: 'drb', label: 'DRB', name: 'Dribbling' },
  { key: 'def', label: 'DEF', name: 'Defense' },
  { key: 'phy', label: 'PHY', name: 'Physical' },
];
export const GK_STATS = [
  { key: 'div', label: 'DIV', name: 'Diving' },
  { key: 'han', label: 'HAN', name: 'Handling' },
  { key: 'kck', label: 'KCK', name: 'Kicking' },
  { key: 'ref', label: 'REF', name: 'Reflexes' },
  { key: 'spd', label: 'PAC', name: 'Speed' },
  { key: 'gkp', label: 'POS', name: 'Positioning' },
];
export const statsFor = (pos) => (pos === 'GK' ? GK_STATS : OUTFIELD_STATS);

// The 19 formations, by the game's own id and name, each as its eleven
// positions. Where a slot sits on our pitch is ours, worked out in slotsFor().
export const FORMATIONS = [
  { id: 8, name: '4-3-3 Attack', xi: 'GK LB CB CB RB CM CM CAM LW ST RW' },
  { id: 9, name: '4-3-3 Defend', xi: 'GK LB CB CB RB CDM CDM CM LW ST RW' },
  { id: 11, name: '4-3-3 Holding', xi: 'GK LB CB CB RB CDM CM CM LW ST RW' },
  { id: 2, name: '4-4-2 Flat', xi: 'GK LB CB CB RB LM CM CM RM ST ST' },
  { id: 13, name: '4-4-2 Holding', xi: 'GK LB CB CB RB CDM CDM LM RM ST ST' },
  { id: 14, name: '4-1-2-1-2 Wide', xi: 'GK LB CB CB RB CDM LM RM CAM ST ST' },
  { id: 15, name: '4-1-2-1-2 Narrow', xi: 'GK LB CB CB RB CDM CM CM CAM ST ST' },
  { id: 16, name: '4-1-3-2', xi: 'GK LB CB CB RB CDM LM CM RM ST ST' },
  { id: 17, name: '4-1-4-1', xi: 'GK LB CB CB RB CDM LM CM CM RM ST' },
  { id: 18, name: '4-2-3-1 Wide', xi: 'GK LB CB CB RB CDM CDM LM RM CAM ST' },
  { id: 5, name: '3-4-3 Flat', xi: 'GK CB CB CB LM CM CM RM LW ST RW' },
  { id: 1, name: '3-4-3 Diamond', xi: 'GK CB CB CB CDM LM RM CAM LW ST RW' },
  { id: 6, name: '3-5-2', xi: 'GK CB CB CB CDM CDM LM RM CAM ST ST' },
  { id: 3, name: '5-4-1', xi: 'GK LB CB CB CB RB LM CM CM RM ST' },
  { id: 23, name: '5-4-1 Diamond', xi: 'GK LB CB CB CB RB CDM LM RM CAM ST' },
  { id: 22, name: '5-3-2', xi: 'GK LB CB CB CB RB CM CM CM ST ST' },
  { id: 19, name: '5-2-3', xi: 'GK LB CB CB CB RB CM CM LW ST RW' },
  { id: 21, name: '5-2-1-2', xi: 'GK LB CB CB CB RB CM CM CAM ST ST' },
  { id: 20, name: '5-1-2-2', xi: 'GK LB CB CB CB RB CDM CM CM ST ST' },
].map((f) => ({ ...f, positions: f.xi.split(' ') }));

export const formation = (id) => FORMATIONS.find((f) => f.id === Number(id)) || FORMATIONS[0];

// Our pitch, in percent: x runs left to right, y from the attack (0) to our
// own goal (100). Each position has a depth; players who share one spread
// evenly across it.
const DEPTH = { ST: 12, LW: 22, RW: 22, CAM: 34, LM: 44, RM: 44, CM: 47, CDM: 59, LB: 72, RB: 72, CB: 77, GK: 92 };
const SPREAD = { 1: [50], 2: [37, 63], 3: [26, 50, 74] };
const SIDE = { LB: 12, LM: 12, LW: 18, RB: 88, RM: 88, RW: 82 };

export function slotsFor(f) {
  const back5 = f.positions.filter((p) => p === 'CB').length === 3 && f.positions.includes('LB');
  const seen = {};
  const counts = {};
  f.positions.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
  return f.positions.map((pos, i) => {
    const n = (seen[pos] = (seen[pos] || 0) + 1) - 1;
    let x = SIDE[pos] ?? SPREAD[counts[pos]][n];
    let y = DEPTH[pos];
    if (back5 && (pos === 'LB' || pos === 'RB')) { x = pos === 'LB' ? 9 : 91; y = 66; }
    if (pos === 'CM' && counts.CM === 2 && f.positions.includes('CAM') && !f.positions.includes('LM')) y = 50;
    return { i, pos, x, y };
  });
}
