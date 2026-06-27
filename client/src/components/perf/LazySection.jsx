// LazySection — defers mounting a below-the-fold section until it nears the
// viewport, then renders it inside a Suspense boundary. Keeps that section's JS
// (and anything it imports, e.g. framer-motion) OUT of the first paint.
//
// Reserve vertical space with `minHeight` so the late mount doesn't shift layout
// (CLS). `rootMargin` (default 300px) starts loading just before the section
// scrolls into view, so it's usually ready by the time the user reaches it.
//
//   const Testimonials = lazyWithRetry(() => import('../components/home/sections/Testimonials'));
//   <LazySection minHeight={520}><Testimonials /></LazySection>
import { Suspense } from 'react';
import useInViewport from '../../hooks/useInViewport';

export default function LazySection({
  children,
  minHeight = 400,
  rootMargin = '300px',
  className,
  fallback,
}) {
  const [ref, shown] = useInViewport({ rootMargin });
  const placeholder = fallback ?? <div style={{ minHeight }} aria-hidden="true" />;

  return (
    <div ref={ref} className={className}>
      {shown ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}
