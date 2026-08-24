// Personas → live category slugs (verified in the `categories` table).
// Shared between PersonaStep (selection) and PreviewStep (label lookup for
// the live preview badge). Keep this list in sync with what's active in the
// `categories` table — an unknown slug degrades to no label in the preview,
// which is fine but ugly.
import { Sparkles, Briefcase, Camera, Code2, Palette, HeartHandshake } from 'lucide-react';

export const PERSONAS = [
  { id: 'coach',      slug: 'life-coach',           label: 'Coach',       tag: 'Life · Career · Fitness',      desc: 'Help people grow, perform and reach their personal goals.', Icon: Sparkles },
  { id: 'consultant', slug: 'business-consultant',  label: 'Consultant',  tag: 'Business · Strategy · Advice', desc: 'Solve problems and drive real business impact.',            Icon: Briefcase },
  { id: 'creator',    slug: 'content-creator',      label: 'Creator',     tag: 'Content · Media · Community',  desc: 'Build an audience and share what you know.',                Icon: Camera },
  { id: 'engineer',   slug: 'software-engineer',    label: 'Engineer',    tag: 'Software · Product · Data',    desc: 'Build products and solve technical challenges.',            Icon: Code2 },
  { id: 'designer',   slug: 'visual-designer',      label: 'Designer',    tag: 'Visual · Fashion · UX',        desc: 'Design beautiful experiences that people love.',            Icon: Palette },
  { id: 'therapist',  slug: 'psychologist',         label: 'Therapist',   tag: 'Mind · Body · Wellness',       desc: 'Support healing, wellbeing and personal growth.',           Icon: HeartHandshake },
];

export const personaTagForSlug = (slug) =>
  PERSONAS.find((p) => p.slug === slug)?.tag || null;

export const personaLabelForSlug = (slug) =>
  PERSONAS.find((p) => p.slug === slug)?.label || null;
