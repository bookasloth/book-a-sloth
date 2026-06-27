import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { festivePalette, hexToRgb } from '../palette';

const INTENSITY = { soft: 26, med: 46, vivid: 70 };
const SPEED = { calm: 14, normal: 24, lively: 38 };

export default function Holi({ color = '#5227FF', params = {} }) {
  const count = INTENSITY[params.intensity] || INTENSITY.med;
  const speed = SPEED[params.speed] || SPEED.calm;
  const palette = useMemo(() => festivePalette(color, 5).map(hexToRgb), [color]);
  const stateRef = useMemo(() => ({ puffs: [], dims: { w: 0, h: 0 } }), []);

  const init = useCallback((dims) => {
    stateRef.dims = dims;
    stateRef.puffs = Array.from({ length: count }, (_, i) => ({
      x: Math.abs((Math.sin(i * 33.7) * 8123.1) % 1) * dims.w,
      y0: Math.abs((Math.cos(i * 71.3) * 4412.7) % 1) * dims.h,
      r: 6 + Math.abs((Math.sin(i * 9.1) * 40) % 1) * 16,
      c: palette[i % palette.length],
      sway: Math.abs((Math.cos(i * 3.3) * 7) % 1) * 18,
      ph: (i % 100) / 100 * Math.PI * 2,
    }));
  }, [count, palette, stateRef]);

  const draw = useCallback((ctx, t, dims) => {
    for (const p of stateRef.puffs) {
      const y = ((p.y0 - t * speed) % dims.h + dims.h) % dims.h;
      const lifeT = 1 - y / dims.h;
      const x = p.x + Math.sin(t * 0.6 + p.ph) * p.sway;
      const alpha = Math.max(0, (0.10 + 0.12 * Math.sin(p.ph + t * 0.5)) * (0.4 + 0.6 * lifeT));
      const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
      g.addColorStop(0, `rgba(${p.c.r},${p.c.g},${p.c.b},${alpha})`);
      g.addColorStop(1, `rgba(${p.c.r},${p.c.g},${p.c.b},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [stateRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
