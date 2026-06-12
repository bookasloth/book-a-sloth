import { motion } from "framer-motion";

/**
 * Calm fade-up reveal on scroll-into-view.
 * Subtle by design: 24px rise, 0.98 → 1 scale, soft easing, no bounce.
 * Use `as` to change the rendered tag, `delay` for stagger.
 */
const EASE = [0.22, 1, 0.36, 1];

export default function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 24,
  className = "",
  once = true,
  amount = 0.25,
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
