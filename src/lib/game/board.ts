// Aadu Pulli Aatam board: 23 vertices.
// Apex (1) + two triangle-side points (2) + a 5x4 Alquerque grid (20).

export type Point = { x: number; y: number };

const coords: Point[] = [
  { x: 2, y: 0 }, // 0 apex
  { x: 1, y: 1 }, // 1 left triangle point
  { x: 3, y: 1 }, // 2 right triangle point
];

// grid rows y = 2..5, x = 0..4  => indices 3..22
for (let y = 2; y <= 5; y++) {
  for (let x = 0; x <= 4; x++) {
    coords.push({ x, y });
  }
}

export const POINTS: readonly Point[] = coords;
export const NODE_COUNT = POINTS.length; // 23

const gridIndex = (x: number, y: number) => 3 + (y - 2) * 5 + x;
const inGrid = (x: number, y: number) => x >= 0 && x <= 4 && y >= 2 && y <= 5;

const edgeSet = new Set<string>();
const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const addEdge = (a: number, b: number) => edgeSet.add(key(a, b));

// Triangle: apex -> side points -> top corners of the grid
addEdge(0, 1);
addEdge(0, 2);
addEdge(1, 2);
addEdge(1, gridIndex(0, 2));
addEdge(2, gridIndex(4, 2));
// Centre vertical line from the apex
addEdge(0, gridIndex(2, 2));

// Grid orthogonals
for (let y = 2; y <= 5; y++) {
  for (let x = 0; x <= 4; x++) {
    if (x < 4) addEdge(gridIndex(x, y), gridIndex(x + 1, y));
    if (y < 5) addEdge(gridIndex(x, y), gridIndex(x, y + 1));
  }
}

// Grid diagonals (Alquerque checkerboard pattern)
for (let y = 2; y <= 5; y++) {
  for (let x = 0; x <= 4; x++) {
    if ((x + y) % 2 !== 0) continue;
    if (inGrid(x + 1, y + 1)) addEdge(gridIndex(x, y), gridIndex(x + 1, y + 1));
    if (inGrid(x - 1, y + 1)) addEdge(gridIndex(x, y), gridIndex(x - 1, y + 1));
  }
}

export const ADJACENCY: number[][] = Array.from({ length: NODE_COUNT }, () => []);
for (const k of edgeSet) {
  const [a, b] = k.split("-").map(Number);
  ADJACENCY[a].push(b);
  ADJACENCY[b].push(a);
}
ADJACENCY.forEach((list) => list.sort((a, b) => a - b));

export const EDGES: [number, number][] = [...edgeSet].map(
  (k) => k.split("-").map(Number) as [number, number],
);

/** JUMPS[from] = list of [over, landing] straight-line capture paths. */
export const JUMPS: [number, number][][] = Array.from({ length: NODE_COUNT }, () => []);
for (let from = 0; from < NODE_COUNT; from++) {
  for (const over of ADJACENCY[from]) {
    const dx = POINTS[over].x - POINTS[from].x;
    const dy = POINTS[over].y - POINTS[from].y;
    const tx = POINTS[over].x + dx;
    const ty = POINTS[over].y + dy;
    const landing = POINTS.findIndex((p) => Math.abs(p.x - tx) < 1e-6 && Math.abs(p.y - ty) < 1e-6);
    if (landing >= 0 && ADJACENCY[over].includes(landing)) {
      JUMPS[from].push([over, landing]);
    }
  }
}

/** Human-readable node labels, e.g. "A1". */
export const LABELS: string[] = POINTS.map((p, i) =>
  i === 0 ? "APEX" : `${String.fromCharCode(65 + p.y)}${p.x + 1}`,
);

/** Central / high-mobility nodes, weighted for the AI heuristic. */
export const CENTRALITY: number[] = ADJACENCY.map((a) => a.length);
