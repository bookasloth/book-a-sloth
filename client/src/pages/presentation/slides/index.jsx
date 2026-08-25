import S01Hook from './S01Hook';
import S02Problem from './S02Problem';
import S03Idea from './S03Idea';
import S04How from './S04How';
import S05Demo from './S05Demo';
import S06Sides from './S06Sides';
import S07Transform from './S07Transform';
import S08Who from './S08Who';
import S09Pricing from './S09Pricing';
import S10Start from './S10Start';

export const SLIDES = [
  { key: 'hook',      title: 'Book a Sloth',        Component: S01Hook },
  { key: 'problem',   title: 'The Problem',         eyebrow: 'The problem',  Component: S02Problem },
  { key: 'idea',      title: 'The Idea',            eyebrow: 'The idea',     Component: S03Idea },
  { key: 'how',       title: 'How It Works',        eyebrow: 'How it works', Component: S04How },
  { key: 'demo',      title: 'Try a Booking',       eyebrow: 'Live demo',    Component: S05Demo },
  { key: 'sides',     title: 'Two Sides',           eyebrow: 'Two sides',    Component: S06Sides },
  { key: 'transform', title: 'Before & After',      eyebrow: 'The shift',    Component: S07Transform },
  { key: 'who',       title: "Who It's For",        eyebrow: "Who it's for", Component: S08Who },
  { key: 'pricing',   title: 'Simple Pricing',      eyebrow: 'Pricing',      Component: S09Pricing },
  { key: 'start',     title: 'Get Started',         eyebrow: 'Get started',  Component: S10Start },
];
