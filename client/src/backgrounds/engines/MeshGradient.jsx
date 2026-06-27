import { useCallback, useMemo } from 'react';
import useBackgroundCanvas from '../useBackgroundCanvas';
import { hexToRgb, tint, rotateHue } from '../palette';

const SPEED = { calm: 0.06, normal: 0.12, lively: 0.22 };
const BLUR = { soft: 0.9, med: 0.7, strong: 0.5 };

export default function MeshGradient({ color = '#5227FF', params = {} }) {
  const speed = SPEED[params.speed] || SPEED.calm;
  const blur = BLUR[params.blur] || BLUR.soft;
  const base = useMemo(() => hexToRgb(tint(color, 0.5)), [color]);
  const blobs = useMemo(() => {
    const cols = [tint(color, 0.1), rotateHue(color, -24), rotateHue(color, 24), tint(color, 0.3)].map(hexToRgb);
    return cols.map((c, i) => ({ c, ph: i * 1.9, ax: 0.2 + 0.2 * i, ay: 0.15 + 0.18 * i }));
  }, [color]);
  const stateRef = useMemo(() => ({ dims: { w: 0, h: 0 } }), []);
  const init = useCallback((dims) => { stateRef.dims = dims; }, [stateRef]);

  const draw = useCallback((ctx, t, dims) => {
    ctx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
    ctx.fillRect(0, 0, dims.w, dims.h);
    const R = Math.max(dims.w, dims.h) * blur;
    blobs.forEach((b, i) => {
      const x = dims.w * (0.5 + 0.4 * Math.sin(t * speed * 6 + b.ph) * b.ax * (i % 2 ? 1 : -1));
      const y = dims.h * (0.5 + 0.4 * Math.cos(t * speed * 6 + b.ph * 1.3) * b.ay);
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(${b.c.r},${b.c.g},${b.c.b},0.55)`);
      g.addColorStop(1, `rgba(${b.c.r},${b.c.g},${b.c.b},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, dims.w, dims.h);
    });
  }, [base, blobs, speed, blur, stateRef]);

  const ref = useBackgroundCanvas({ init, draw });
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
