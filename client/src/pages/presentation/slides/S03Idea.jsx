import Reveal from '../../../components/home/Reveal';
export default function S03Idea({ hostCtx }) {
  const u = hostCtx?.host?.username || 'you';
  return (
    <div className="text-center">
      <Reveal><h2 className="font-heading text-3xl sm:text-4xl">One calm link connects <span className="text-primary">all of it</span>.</h2></Reveal>
      <Reveal delay={0.1}><p className="mt-4 text-muted">Made for India. Not adapted for it.</p></Reveal>
      <Reveal delay={0.2}>
        <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ink text-white px-5 py-3 font-mono text-sm sm:text-base">
          <span className="opacity-60">bookasloth.com/</span><span style={{ color: 'var(--accent)' }}>{u}</span>
        </div>
      </Reveal>
    </div>
  );
}
