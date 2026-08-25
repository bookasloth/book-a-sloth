import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SlideShell from './SlideShell';

export default function Deck({ slides, index, direction, hostCtx, onSwipe }) {
  const { title, Component, eyebrow } = slides[index];
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-0"
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
      onDragEnd={(e, info) => { if (info.offset.x < -80) onSwipe(1); else if (info.offset.x > 80) onSwipe(-1); }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slides[index].key}
          custom={direction}
          initial={reduce ? false : { opacity: 0, x: direction > 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${title}`}
        >
          <SlideShell eyebrow={eyebrow}>
            <Component hostCtx={hostCtx} />
          </SlideShell>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
