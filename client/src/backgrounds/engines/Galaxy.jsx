import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { hexToRgb, tint } from '../palette';

const COUNT = { low: 70, medium: 130, high: 220 };
const SPEED = { calm: 6, normal: 12, lively: 22 };

export default function Galaxy({ color = '#5227FF', params = {} }) {
  const count = COUNT[params.starCount] || COUNT.medium;
  const speed = SPEED[params.speed] || SPEED.calm;
  const rgb = useMemo(() => hexToRgb(tint(color, 0.4)), [color]);

  const starsRef = useMemo(() => ({ list: [], dims: { w: 0, h: 0 } }), []);
  const init = useCallback((dims) => {
    starsRef.dims = dims;
    starsRef.list = Array.from({ length: count }, (_, i) => ({
      x: Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * dims.w,
      y: Math.abs((Math.cos(i * 78.233) * 12543.123) % 1) * dims.h,
      r: 0.4 + ((i % 7) / 7) * 1.6,
      ph: (i % 100) / 100 * Math.PI * 2,
    }));
  }, [count, starsRef]);

  const draw = useCallback((ctx, t, dims) => {
    for (const s of starsRef.list) {
      const y = (s.y + t * speed) % dims.h;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + s.ph);
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.25 + tw * 0.6})`;
      ctx.fill();
    }
  }, [rgb, speed, starsRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
