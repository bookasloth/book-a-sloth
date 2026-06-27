import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Galaxy from '../engines/Galaxy';
afterEach(cleanup);
it('renders a canvas with color + params', () => {
  const { container } = render(<div style={{ width: 300, height: 200 }}><Galaxy color="#FE5100" params={{ starCount: 'high' }} /></div>);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
