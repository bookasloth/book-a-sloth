/**
 * Opening.jsx — the standalone /opening route (full-stage, no chrome).
 * Renders the shared ceremony. The same ceremony also runs as the site-wide
 * takeover overlay (components/opening/OpeningTakeover.jsx) during the window.
 */
import { useNavigate } from 'react-router-dom';
import Seo from '../components/common/Seo';
import OpeningCeremony from '../components/opening/OpeningCeremony';
import '../styles/opening.css';

export default function Opening() {
  const navigate = useNavigate();
  return (
    <>
      <Seo title="The Opening — Book A Sloth" description="Cut the ribbon. Open Book A Sloth. Put your name in stone, forever." />
      <OpeningCeremony onExit={(reason) => { if (reason === 'skip') navigate('/'); }} />
    </>
  );
}
