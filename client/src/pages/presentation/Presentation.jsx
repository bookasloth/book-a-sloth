import { useHideChrome } from '../../context/ChromeContext';

export default function Presentation() {
  useHideChrome(); // drops navbar, footer, consent banner, bot — bare canvas
  return (
    <main
      className="fixed inset-0 overflow-hidden bg-canvas text-ink"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="h-full w-full grid place-items-center">
        <h1 className="font-heading text-4xl">Presentation</h1>
      </div>
    </main>
  );
}
