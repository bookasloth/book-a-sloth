import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SlideShell from './SlideShell';

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

export default function Deck({ slides, index, direction, hostCtx, onSwipe }) {
  const { title, Component, eyebrow } = slides[index];
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-0"
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
      onDragEnd={(e, info) => { if (info.offset.x < -80) onSwipe(1); else if (info.offset.x > 80) onSwipe(-1); }}
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={slides[index].key}
          custom={direction}
          variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
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
