import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Rain from '../engines/Rain';
afterEach(cleanup);
it('renders a canvas with color + params', () => {
  const { container } = render(<div style={{ width: 300, height: 200 }}><Rain color="#FE5100" params={{ density: 'high' }} /></div>);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
