import Reveal from '../../../components/home/Reveal';
export default function S01Hook() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 items-center">
      <div>
        <Reveal><h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">Your booking link that <span className="text-primary">actually gets you paid</span>.</h1></Reveal>
        <Reveal delay={0.1}><p className="mt-5 text-lg text-muted max-w-md">Share one link — clients book, pay over UPI, and the money lands in your account.</p></Reveal>
        <Reveal delay={0.2}><a href="/be-a-sloth" className="btn-primary inline-block mt-7">Continue with Google</a></Reveal>
      </div>
      <Reveal delay={0.15} className="justify-self-center">
        <img src="/sloth.png" alt="Book a Sloth mascot" width={320} height={320} className="w-56 sm:w-72 lg:w-80 h-auto" loading="eager" />
      </Reveal>
    </div>
  );
}
