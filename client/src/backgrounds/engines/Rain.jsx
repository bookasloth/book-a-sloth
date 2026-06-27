import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { hexToRgb, tint } from '../palette';

const DENSITY = { low: 60, medium: 120, high: 220 };
const SPEED = { calm: 280, normal: 460, lively: 700 };
const ANGLE = 0.21; // ~12deg slant

export default function Rain({ color = '#5227FF', params = {} }) {
  const count = DENSITY[params.density] || DENSITY.medium;
  const speed = SPEED[params.speed] || SPEED.normal;
  const rgb = useMemo(() => hexToRgb(tint(color, 0.45)), [color]);
  const stateRef = useMemo(() => ({ drops: [], dims: { w: 0, h: 0 } }), []);

  const init = useCallback((dims) => {
    stateRef.dims = dims;
    stateRef.drops = Array.from({ length: count }, (_, i) => ({
      x: Math.abs((Math.sin(i * 91.17) * 7331.7) % 1) * (dims.w * 1.2) - dims.w * 0.1,
      y: Math.abs((Math.cos(i * 45.3) * 1234.5) % 1) * dims.h,
      len: 8 + Math.abs((Math.sin(i * 12.3) * 99) % 1) * 10,
      v: 0.7 + Math.abs((Math.cos(i * 5.1) * 13) % 1) * 0.6,
    }));
  }, [count, stateRef]);

  const draw = useCallback((ctx, t, dims) => {
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`;
    for (const d of stateRef.drops) {
      const y = (d.y + t * speed * d.v) % (dims.h + 20);
      const x = d.x + y * ANGLE;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * ANGLE, y - d.len);
      ctx.stroke();
    }
  }, [rgb, speed, stateRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
