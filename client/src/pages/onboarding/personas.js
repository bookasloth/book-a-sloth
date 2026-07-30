// Personas → live category slugs (verified in the `categories` table).
// Shared between PersonaStep (selection) and PreviewStep (label lookup for
// the live preview badge). Keep this list in sync with what's active in the
// `categories` table — an unknown slug degrades to no label in the preview,
// which is fine but ugly.
import { Sparkles, Briefcase, Camera, Code2, Palette, HeartHandshake } from 'lucide-react';

export const PERSONAS = [
  { id: 'coach',      slug: 'life-coach',           label: 'Coach',       tag: 'Life · Career · Fitness',      Icon: Sparkles },
  { id: 'consultant', slug: 'business-consultant',  label: 'Consultant',  tag: 'Business · Strategy · Advice', Icon: Briefcase },
  { id: 'creator',    slug: 'content-creator',      label: 'Creator',     tag: 'Content · Media · Community',  Icon: Camera },
  { id: 'engineer',   slug: 'software-engineer',    label: 'Engineer',    tag: 'Software · Product · Data',    Icon: Code2 },
  { id: 'designer',   slug: 'visual-designer',      label: 'Designer',    tag: 'Visual · Fashion · UX',        Icon: Palette },
  { id: 'therapist',  slug: 'psychologist',         label: 'Therapist',   tag: 'Mind · Body · Wellness',       Icon: HeartHandshake },
];

export const personaLabelForSlug = (slug) =>
  PERSONAS.find((p) => p.slug === slug)?.label || null;
