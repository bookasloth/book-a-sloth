import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { festivePalette, hexToRgb, tint } from '../palette';

const GLOW = { soft: 0.5, med: 0.75, bright: 1 };
const RATE = { calm: 4.5, normal: 3, lively: 1.8 }; // seconds per firework window

export default function Diwali({ color = '#5227FF', params = {} }) {
  const glow = GLOW[params.glow] || GLOW.med;
  const rate = RATE[params.rate] || RATE.calm;
  const warm = useMemo(() => hexToRgb(tint(color, 0.35)), [color]);
  const palette = useMemo(() => festivePalette(color, 4).map(hexToRgb), [color]);
  const stateRef = useMemo(() => ({ diyas: [], dims: { w: 0, h: 0 } }), []);

  const init = useCallback((dims) => {
    stateRef.dims = dims;
    const n = Math.max(5, Math.round(dims.w / 120));
    stateRef.diyas = Array.from({ length: n }, (_, i) => ({ x: (i + 0.5) / n * dims.w, ph: i * 1.7 }));
  }, [stateRef]);

  const draw = useCallback((ctx, t, dims) => {
    const baseY = dims.h - 8;
    for (const d of stateRef.diyas) {
      const flick = 0.8 + 0.2 * Math.sin(t * 5 + d.ph) + 0.05 * Math.sin(t * 13 + d.ph);
      const r = 26 * glow * flick;
      const g = ctx.createRadialGradient(d.x, baseY, 0, d.x, baseY, r);
      g.addColorStop(0, `rgba(${warm.r},${warm.g},${warm.b},${0.5 * glow * flick})`);
      g.addColorStop(1, `rgba(${warm.r},${warm.g},${warm.b},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, baseY, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let k = 0; k < 3; k++) {
      const seed = k * 97.13;
      const phase = ((t + seed) % (rate * 3)) / (rate * 3);
      if (phase > 0.5) continue;
      const life = phase / 0.5;
      const cx = Math.abs((Math.sin(seed * 1.7) * 100) % 1) * dims.w;
      const cy = dims.h * (0.2 + 0.3 * Math.abs((Math.cos(seed * 2.3) * 10) % 1));
      const col = palette[k % palette.length];
      const sparks = 16;
      const rad = life * 70;
      const a = (1 - life) * 0.9;
      for (let s = 0; s < sparks; s++) {
        const ang = (s / sparks) * Math.PI * 2;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad + life * life * 20;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${Math.max(0, a)})`;
        ctx.fill();
      }
    }
  }, [warm, palette, glow, rate, stateRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
