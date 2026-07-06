import {
  TrendingUp, HeartPulse, Scissors, Zap, BookOpen,
  Camera, CalendarCheck, Scale, Laptop, Building2,
} from 'lucide-react';

/**
 * Industry use-case registry.
 *
 * Each entry supports:
 *   label       — display name
 *   desc        — one-line description
 *   href        — destination (can include query params)
 *   icon        — lucide-react component
 *   badge       — optional string: 'Popular' | 'New' | 'Coming Soon'
 *   featured    — boolean: highlight in a "Featured" section (future)
 *   external    — boolean: open in new tab
 *   event       — analytics event name (future)
 *   category    — category slug for filtering
 *
 * Adding a new industry only requires a new entry here.
 */
export const USE_CASES_CONFIG = [
  {
    label: 'Coaches & Consultants',
    desc: 'Book meetings and collect payments effortlessly.',
    href: '/for/business-consultant',
    icon: TrendingUp,
    category: 'coaching-consulting',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    color: '#7c3aed', // violet — ambition, growth
  },
  {
    label: 'Doctors & Clinics',
    desc: 'Appointment scheduling with reminders.',
    href: '/for/doctors',
    icon: HeartPulse,
    category: 'health-wellness',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    color: '#2563eb', // blue — trust, medicine
  },
  {
    label: 'Salons & Spas',
    desc: 'Manage clients, staff, and bookings.',
    href: '/explore?category=salons-spas',
    icon: Scissors,
    category: 'salons-spas',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
    color: '#ec4899', // pink — beauty, luxury
  },
  {
    label: 'Fitness Trainers',
    desc: 'Schedule personal and group sessions.',
    href: '/explore?category=fitness',
    icon: Zap,
    category: 'fitness',
    badge: 'Popular',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    color: '#f97316', // orange — energy, fire
  },
  {
    label: 'Tutors & Educators',
    desc: 'Online and offline class bookings.',
    href: '/explore?category=education',
    icon: BookOpen,
    category: 'education',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    color: '#f59e0b', // amber — knowledge, curiosity
  },
  {
    label: 'Photographers',
    desc: 'Book shoots and manage clients.',
    href: '/explore?category=photography',
    icon: Camera,
    category: 'photography',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    color: '#475569', // slate — film, artistry
  },
  {
    label: 'Event Organisers',
    desc: 'Handle consultations and bookings.',
    href: '/explore?category=events',
    icon: CalendarCheck,
    category: 'events',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    color: '#9333ea', // purple — celebration, flair
  },
  {
    label: 'Lawyers & CAs',
    desc: 'Professional appointment scheduling.',
    href: '/for/lawyers',
    icon: Scale,
    category: 'legal-finance',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-800',
    color: '#1f2937', // near-black — authority, gravitas
  },
  {
    label: 'Freelancers',
    desc: 'Let clients book your availability.',
    href: '/explore?category=freelance',
    icon: Laptop,
    category: 'freelance',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    color: '#0d9488', // teal — digital, remote
  },
  {
    label: 'Agencies & Studios',
    desc: 'Manage discovery calls and projects.',
    href: '/explore?category=agencies',
    icon: Building2,
    category: 'agencies',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    color: '#059669', // emerald — growth, scale
  },
];
