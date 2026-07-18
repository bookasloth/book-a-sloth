import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Markdown from '../Markdown';

const html = (node) => {
  const { container } = render(<MemoryRouter>{node}</MemoryRouter>);
  return container;
};

describe('Markdown externalLinks prop', () => {
  it('strip: external link renders as plain text, no anchor', () => {
    const c = html(<Markdown source="See [x](https://evil.com) here" externalLinks="strip" />);
    expect(c.querySelector('a[href^="http"]')).toBeNull();
    expect(c.textContent).toContain('x');
  });
  it('strip: internal link still renders as a link', () => {
    const c = html(<Markdown source="Go to [My Bookings](/my-bookings)" externalLinks="strip" />);
    expect(c.querySelector('a[href="/my-bookings"]')).not.toBeNull();
  });
  it('allow (default): external link renders as an anchor', () => {
    const c = html(<Markdown source="See [x](https://ok.com)" />);
    expect(c.querySelector('a[href="https://ok.com"]')).not.toBeNull();
  });
});
