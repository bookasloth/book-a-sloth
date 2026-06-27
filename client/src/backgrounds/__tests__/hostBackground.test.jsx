import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import HostBackground from '../HostBackground';

afterEach(cleanup);

describe('HostBackground', () => {
  it('renders the masked band wrapper', () => {
    const { container } = render(<HostBackground typeKey="dotgrid" color="#FE5100" />);
    expect(container.querySelector('[data-bg-band]')).toBeInTheDocument();
  });
  it('renders nothing engine-side for an unknown key', () => {
    const { container } = render(<HostBackground typeKey="nope" color="#FE5100" />);
    expect(container.querySelector('[data-bg-band]')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
  });
  it('renders a static fallback under reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { container } = render(<HostBackground typeKey="dotgrid" color="#FE5100" />);
    expect(container.querySelector('[data-bg-static]')).toBeInTheDocument();
  });
});
