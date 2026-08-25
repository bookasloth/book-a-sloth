import { useState, useRef } from 'react';
import { useHideChrome } from '../../context/ChromeContext';
import { SLIDES } from './slides';
import { useDeckNav } from './useDeckNav';
import { usePresentationHost } from './usePresentationHost';
import Deck from './Deck';
import DeckControls from './DeckControls';
import SlideOverview from './SlideOverview';

export default function Presentation() {
  useHideChrome();
  const { index, next, prev, go } = useDeckNav(SLIDES);
  const hostCtx = usePresentationHost();
  const [overview, setOverview] = useState(false);
  const prevIndex = useRef(index);
  const direction = index >= prevIndex.current ? 1 : -1;
  prevIndex.current = index;

  return (
    <main className="fixed inset-0 overflow-hidden bg-canvas text-ink" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <Deck slides={SLIDES} index={index} direction={direction} hostCtx={hostCtx} onSwipe={(d) => (d > 0 ? next() : prev())} />
      <DeckControls index={index} total={SLIDES.length} onPrev={prev} onNext={next} onJump={go}
        onToggleOverview={() => setOverview(true)} source={hostCtx.source} />
      {overview && <SlideOverview slides={SLIDES} index={index} onJump={go} onClose={() => setOverview(false)} />}
    </main>
  );
}
