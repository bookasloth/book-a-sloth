/**
 * Stone.jsx — one opener's permanent stone on the Inaugurators Wall.
 *
 * A stone is an inline-SVG pebble (one of SHAPES variants) filled with one of
 * SHADES brand tints, the opener's name laid across it. Shade + shape come from
 * the server row (chosen at insert), so a stone looks identical on every reload.
 * No numbers, no links — the stone is the keepsake.
 */

// 6 brand tints (existing design tokens — see tailwind.config.js). Index = shade.
export const SHADES = ['#FE5100', '#f59e0b', '#059669', '#2563eb', '#7c3aed', '#db2777'];

// 4 pebble silhouettes in a 100×100 box. Index = shape.
export const SHAPES = [
  'M50 6C74 6 94 24 94 50 94 78 74 94 50 94 24 94 6 76 6 50 6 24 26 6 50 6Z',
  'M50 8C78 4 96 28 92 54 88 82 66 96 42 92 16 88 6 62 12 38 18 18 30 10 50 8Z',
  'M52 6C80 8 96 30 92 56 88 80 64 94 40 90 18 86 8 60 14 36 20 14 32 4 52 6Z',
  'M48 6C72 2 94 22 94 48 94 74 76 96 48 94 22 92 8 70 8 46 8 22 26 10 48 6Z',
];

const shadeOf = (i) => SHADES[((i % SHADES.length) + SHADES.length) % SHADES.length];
const shapeOf = (i) => SHAPES[((i % SHAPES.length) + SHAPES.length) % SHAPES.length];

// Fit the name inside the stone: shrink font as the name grows.
const fontFor = (name = '') => (name.length > 14 ? 11 : name.length > 9 ? 13 : 16);

export default function Stone({ name, message, shade = 0, shape = 0, className = '' }) {
  const fill = shadeOf(shade);
  const d = shapeOf(shape);
  return (
    <figure className={`group relative flex flex-col items-center ${className}`} title={message || name}>
      <svg viewBox="0 0 100 100" className="w-full h-auto drop-shadow-sm" role="img" aria-label={name}>
        <defs>
          <linearGradient id={`g-${shade}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fill} stopOpacity="0.95" />
            <stop offset="1" stopColor={fill} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#g-${shade})`} />
        <text
          x="50" y="54" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Plus Jakarta Sans, Poppins, sans-serif" fontWeight="700"
          fontSize={fontFor(name)} fill="#fff"
          style={{ paintOrder: 'stroke' }}
        >
          {name}
        </text>
      </svg>
      {message ? (
        <figcaption className="mt-1 max-w-[12ch] truncate text-center text-[11px] italic text-muted opacity-0 transition-opacity group-hover:opacity-100">
          “{message}”
        </figcaption>
      ) : null}
    </figure>
  );
}
