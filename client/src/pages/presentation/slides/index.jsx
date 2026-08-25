import S01Hook from './S01Hook';
import S02Problem from './S02Problem';
import S03Idea from './S03Idea';
import S04How from './S04How';
import S05Demo from './S05Demo';

function Placeholder({ title }) { return <div className="text-center"><h2 className="font-heading text-3xl">{title}</h2></div>; }
const P = (title) => () => <Placeholder title={title} />;

export const SLIDES = [
  { key: 'hook',      title: 'Book a Sloth',        Component: S01Hook },
  { key: 'problem',   title: 'The Problem',         eyebrow: 'The problem',  Component: S02Problem },
  { key: 'idea',      title: 'The Idea',            eyebrow: 'The idea',     Component: S03Idea },
  { key: 'how',       title: 'How It Works',        eyebrow: 'How it works', Component: S04How },
  { key: 'demo',      title: 'Try a Booking',       eyebrow: 'Live demo',    Component: S05Demo },
  { key: 'sides',     title: 'Two Sides',           Component: P('Two Sides') },
  { key: 'transform', title: 'Before & After',      Component: P('Before & After') },
  { key: 'who',       title: "Who It's For",        Component: P("Who It's For") },
  { key: 'pricing',   title: 'Simple Pricing',      Component: P('Simple Pricing') },
  { key: 'start',     title: 'Get Started',         Component: P('Get Started') },
];
