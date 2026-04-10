export const CANVAS_HEIGHT = 2000;
export const CANVAS_WIDTH = 2000;
export const CANVAS_SIZE = CANVAS_HEIGHT * CANVAS_WIDTH;

export const CANVAS_COLORS = [
  // Neutral
  '#ffffff',
  '#e0e0e0',
  '#c4c4c4',
  '#9e9e9e',
  '#6b6b6b',
  '#3d3d3d',
  '#1c1c1c',
  '#000000',
  // Red / orange
  '#7a0000',
  '#cc0000',
  '#ff0000',
  '#ff4422',
  '#ff6600',
  '#ff9933',
  '#ffbb55',
  '#ffd699',
  // Yellow / lime
  '#998800',
  '#ccaa00',
  '#ffcc00',
  '#ffee00',
  '#ccff00',
  '#88ee00',
  '#44cc00',
  '#006600',
  // Green / cyan
  '#003322',
  '#006644',
  '#00aa66',
  '#00ff88',
  '#00ffcc',
  '#00dddd',
  '#00aaaa',
  '#007777',
  // Blue
  '#001133',
  '#002299',
  '#0044ff',
  '#0088ff',
  '#00bbff',
  '#66ddff',
  '#aaeeff',
  '#ddf4ff',
  // Purple / pink
  '#220033',
  '#660099',
  '#aa00dd',
  '#dd00ff',
  '#ff00cc',
  '#ff4499',
  '#ff88bb',
  '#ffbbdd',
  // Earthy / flesh
  '#3b1a08',
  '#6b3311',
  '#995522',
  '#cc8844',
  '#ddaa77',
  '#eec89a',
  '#f5dfc0',
  '#fff3e0',
  // Cold dark / indigo
  '#050d1a',
  '#0d1b3e',
  '#1a2f6e',
  '#2e4a9e',
  '#4a6cbf',
  '#7090d4',
  '#a0b8e8',
  '#ccd8f5',
] as const;

export const CANVAS_COLORS_RGB = CANVAS_COLORS.map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);

export type CanvasColor = (typeof CANVAS_COLORS)[number];

export const MAX_FILL_AREA = 200_000;
