import { useState } from 'react';
import Reveal from '../../../components/home/Reveal';
import SegmentedControl from '../../../components/dashboard/ui/SegmentedControl';
const BEFORE = ['Chasing replies across 8 apps', 'Payments after the session (maybe)', 'No-shows with no deposit', 'Your calendar in your head'];
const AFTER = ['One link does the booking', 'Paid upfront over UPI', 'Auto-reminders cut no-shows', 'Everything in one calm dashboard'];
export default function S07Transform() {
  const [v, setV] = useState('before');
  const rows = v === 'before' ? BEFORE : AFTER;
  return (
    <div className="text-center">
      <Reveal><h2 className="font-heading text-3xl sm:text-4xl">Before &amp; <span className="text-primary">after</span>.</h2></Reveal>
      <div className="mt-5 inline-block"><SegmentedControl options={[{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }]} value={v} onChange={setV} /></div>
      <div className="mt-6 grid gap-2 max-w-md mx-auto">
        {rows.map((r) => (
          <div key={r} className="page-card p-3 text-left text-sm flex items-center gap-2">
            <span>{v === 'before' ? '⚠️' : '✅'}</span>{r}
          </div>
        ))}
      </div>
    </div>
  );
}
