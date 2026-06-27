import { lazy } from 'react';

export const BACKGROUNDS = [
  {
    key: 'dotgrid',
    label: 'Dot Grid',
    seasonal: false,
    thumbnail: '/backgrounds/dotgrid.svg',
    Component: lazy(() => import('./engines/DotGrid.jsx')),
    defaultParams: { density: 'medium', speed: 'normal' },
    paramSchema: [
      { key: 'density', label: 'Density', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'speed', label: 'Speed', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
];

export const backgroundKeys = BACKGROUNDS.map((b) => b.key);
export const getBackground = (key) => BACKGROUNDS.find((b) => b.key === key);
