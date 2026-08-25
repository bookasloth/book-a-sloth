import Reveal from '../../../components/home/Reveal';
const TOOLS = ['Instagram DMs', 'WhatsApp', 'Phone calls', 'Google Calendar', 'UPI apps', 'Notes', 'Spreadsheets', 'Manual follow-ups'];
export default function S02Problem() {
  return (
    <div>
      <Reveal><h2 className="font-heading text-3xl sm:text-4xl max-w-2xl">Getting booked today means juggling <span className="text-primary">eight different apps</span>.</h2></Reveal>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOLS.map((t, i) => (
          <Reveal key={t} delay={i * 0.05}><div className="page-card p-4 text-center text-sm font-medium" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 1.5}deg)` }}>{t}</div></Reveal>
        ))}
      </div>
      <Reveal delay={0.4}><p className="mt-8 text-muted">Messages get missed. Payments slip. You become your own overworked receptionist.</p></Reveal>
    </div>
  );
}
