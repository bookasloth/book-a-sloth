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
  {
    key: 'galaxy',
    label: 'Galaxy',
    seasonal: false,
    thumbnail: '/backgrounds/galaxy.svg',
    Component: lazy(() => import('./engines/Galaxy.jsx')),
    defaultParams: { starCount: 'medium', speed: 'calm' },
    paramSchema: [
      { key: 'starCount', label: 'Stars', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'speed', label: 'Drift', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
  {
    key: 'rain',
    label: 'Rain',
    seasonal: false,
    thumbnail: '/backgrounds/rain.svg',
    Component: lazy(() => import('./engines/Rain.jsx')),
    defaultParams: { density: 'medium', speed: 'normal' },
    paramSchema: [
      { key: 'density', label: 'Density', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'speed', label: 'Speed', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
  {
    key: 'holi',
    label: 'Holi',
    seasonal: true,
    thumbnail: '/backgrounds/holi.svg',
    Component: lazy(() => import('./engines/Holi.jsx')),
    defaultParams: { intensity: 'med', speed: 'calm' },
    paramSchema: [
      { key: 'intensity', label: 'Intensity', type: 'select', options: ['soft', 'med', 'vivid'] },
      { key: 'speed', label: 'Speed', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
  {
    key: 'diwali',
    label: 'Diwali',
    seasonal: true,
    thumbnail: '/backgrounds/diwali.svg',
    Component: lazy(() => import('./engines/Diwali.jsx')),
    defaultParams: { glow: 'med', rate: 'calm' },
    paramSchema: [
      { key: 'glow', label: 'Glow', type: 'select', options: ['soft', 'med', 'bright'] },
      { key: 'rate', label: 'Fireworks', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
  {
    key: 'celebration',
    label: 'Celebration',
    seasonal: true,
    thumbnail: '/backgrounds/celebration.svg',
    Component: lazy(() => import('./engines/Celebration.jsx')),
    defaultParams: { density: 'medium', rate: 'normal' },
    paramSchema: [
      { key: 'density', label: 'Density', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'rate', label: 'Fall speed', type: 'select', options: ['calm', 'normal', 'lively'] },
    ],
  },
];

export const backgroundKeys = BACKGROUNDS.map((b) => b.key);
export const getBackground = (key) => BACKGROUNDS.find((b) => b.key === key);
