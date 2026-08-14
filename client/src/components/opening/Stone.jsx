/**
 * Stone.jsx — one opener's permanent stone on the Inaugurators Wall.
 *
 * A carved tall "standing stone" (one of 4 silhouettes), tinted with a muted
 * brand shade, the name set BENEATH it. Shade + shape come from the server row,
 * so a stone looks identical on every reload. No numbers, no pills, no message —
 * the stone + name is the keepsake.
 */

// 4 tall standing-stone silhouettes (100×100 box, stands on the baseline).
const SHAPES = [
  'M50 4C70 4 78 20 80 42C82 66 74 92 50 92C26 92 18 66 20 42C22 20 30 4 50 4Z',
  'M50 6C72 6 82 24 80 50C78 74 68 90 50 90C32 90 22 74 20 50C18 24 28 6 50 6Z',
  'M50 5C66 5 80 18 82 44C84 70 70 91 50 91C30 91 16 70 18 44C20 18 34 5 50 5Z',
  'M50 4C64 4 74 16 78 40C82 68 72 92 50 92C28 92 18 68 22 40C26 16 36 4 50 4Z',
];

// Muted, stone-like tints of the 6 stored brand shades (orange/amber/emerald/blue/violet/pink).
const TINTS = ['#c9a58a', '#cdb98d', '#a7c0a6', '#9fb2cf', '#b6a6c9', '#cba0ad'];

const idx = (i, n) => ((Math.trunc(i) % n) + n) % n;

// darken a hex ~18% for the gradient foot
function darken(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.82);
  const g = Math.round(((n >> 8) & 255) * 0.82);
  const b = Math.round((n & 255) * 0.82);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default function Stone({ name, shade = 0, shape = 0, className = '' }) {
  const d = SHAPES[idx(shape, SHAPES.length)];
  const top = TINTS[idx(shade, TINTS.length)];
  const gid = `st-${idx(shade, TINTS.length)}-${idx(shape, SHAPES.length)}`;
  return (
    <div className={`flex flex-col items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full max-w-[104px] h-auto"
           style={{ filter: 'drop-shadow(0 8px 10px rgba(60,45,20,.18))' }}
           role="img" aria-label={name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={darken(top)} />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(60,45,20,.14)" />
        <path d={d} fill={`url(#${gid})`} stroke="rgba(50,35,15,.28)" strokeWidth="1.5" />
        {/* soft top-light rim */}
        <path d={d} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1"
              transform="translate(-0.8 -0.8)" />
      </svg>
      <span className="font-heading font-extrabold text-[14px] tracking-tight text-ink text-center leading-tight">
        {name}
      </span>
    </div>
  );
}
