function Placeholder({ title }) { return <div className="text-center"><h2 className="font-heading text-3xl">{title}</h2></div>; }
const P = (title) => () => <Placeholder title={title} />;

export const SLIDES = [
  { key: 'hook',      title: 'Book a Sloth',        Component: P('Book a Sloth') },
  { key: 'problem',   title: 'The Problem',         Component: P('The Problem') },
  { key: 'idea',      title: 'The Idea',            Component: P('The Idea') },
  { key: 'how',       title: 'How It Works',        Component: P('How It Works') },
  { key: 'demo',      title: 'Try a Booking',       Component: P('Try a Booking') },
  { key: 'sides',     title: 'Two Sides',           Component: P('Two Sides') },
  { key: 'transform', title: 'Before & After',      Component: P('Before & After') },
  { key: 'who',       title: "Who It's For",        Component: P("Who It's For") },
  { key: 'pricing',   title: 'Simple Pricing',      Component: P('Simple Pricing') },
  { key: 'start',     title: 'Get Started',         Component: P('Get Started') },
];
