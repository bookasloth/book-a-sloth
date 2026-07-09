import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Slide-in push transition for host dashboard route changes. Keyed on
// pathname so each navigation animates in/out.
export function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
