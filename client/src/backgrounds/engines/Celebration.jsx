import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { festivePalette, hexToRgb } from '../palette';

const DENSITY = { low: 50, medium: 90, high: 150 };
const RATE = { calm: 26, normal: 40, lively: 60 };

export default function Celebration({ color = '#5227FF', params = {} }) {
  const count = DENSITY[params.density] || DENSITY.medium;
  const speed = RATE[params.rate] || RATE.normal;
  const palette = useMemo(() => festivePalette(color, 5).map(hexToRgb), [color]);
  const stateRef = useMemo(() => ({ bits: [], dims: { w: 0, h: 0 } }), []);

  const init = useCallback((dims) => {
    stateRef.dims = dims;
    stateRef.bits = Array.from({ length: count }, (_, i) => ({
      x: Math.abs((Math.sin(i * 51.9) * 9173.3) % 1) * dims.w,
      y0: Math.abs((Math.cos(i * 23.7) * 3391.1) % 1) * dims.h,
      w: 4 + Math.abs((Math.sin(i * 7.7) * 6) % 1) * 4,
      h: 6 + Math.abs((Math.cos(i * 4.2) * 8) % 1) * 6,
      c: palette[i % palette.length],
      rot: Math.abs((Math.sin(i * 2.1) * 6) % 1) * Math.PI,
      spin: 0.6 + Math.abs((Math.cos(i * 1.3) * 4) % 1) * 1.6,
      sway: 8 + Math.abs((Math.sin(i * 3.9) * 16) % 1) * 14,
      v: 0.7 + Math.abs((Math.cos(i * 8.8) * 10) % 1) * 0.6,
      ph: (i % 100) / 100 * Math.PI * 2,
    }));
  }, [count, palette, stateRef]);

  const draw = useCallback((ctx, t, dims) => {
    for (const b of stateRef.bits) {
      const y = (b.y0 + t * speed * b.v) % (dims.h + 20);
      const x = b.x + Math.sin(t * 1.2 + b.ph) * b.sway;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.rot + t * b.spin);
      ctx.fillStyle = `rgba(${b.c.r},${b.c.g},${b.c.b},0.9)`;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
  }, [speed, stateRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
