// Accessible, single-open accordion shared by the /enterprise FAQ section and
// the "frequently requested customizations" section (same component, different
// `items` + `idPrefix`). Mirrors the FaqAccordion pattern in
// client/src/pages/for/ProfessionLanding.jsx — motion + a11y kept identical,
// themed with the --ent-* tokens instead of --lp-*.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { analytics, EVENTS } from '../../services/analytics';

export default function EnterpriseFaq({ items, idPrefix, trackOpen }) {
  const [open, setOpen] = useState(null);

  const toggle = (i, question) => {
    const isOpening = open !== i;
    setOpen(isOpening ? i : null);
    if (isOpening && trackOpen) analytics.track(EVENTS.ENTERPRISE_FAQ_OPENED, { question });
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const btnId = `${idPrefix}-btn-${i}`;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-xl border bg-[color:var(--ent-bg)] transition-colors"
            style={{ borderColor: isOpen ? 'color-mix(in srgb, var(--ent-cta) 40%, transparent)' : 'var(--ent-line)' }}
          >
            <button
              type="button"
              id={btnId}
              onClick={() => toggle(i, item.q)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-[color:var(--ent-ink)]"
            >
              {item.q}
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300"
                style={{ backgroundColor: 'color-mix(in srgb, var(--ent-cta) 14%, transparent)', color: 'var(--ent-cta)', transform: isOpen ? 'rotate(45deg)' : 'none' }}
              >
                <Plus size={15} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-[15px] leading-relaxed text-[color:var(--ent-muted)]">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
