// client/src/backgrounds/__tests__/dotgrid.test.jsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import DotGrid from '../engines/DotGrid';

afterEach(cleanup);

describe('DotGrid engine', () => {
  it('renders a canvas and accepts color + params without throwing', () => {
    const { container } = render(<DotGrid color="#FE5100" params={{ density: 'high', speed: 'calm' }} />);
    expect(container.querySelector('canvas.dot-grid__canvas')).toBeInTheDocument();
  });
  it('uses safe defaults for unknown params', () => {
    const { container } = render(<DotGrid color="#FE5100" params={{}} />);
    expect(container.querySelector('.dot-grid')).toBeInTheDocument();
  });
});
