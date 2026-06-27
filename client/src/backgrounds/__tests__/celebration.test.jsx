import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Celebration from '../engines/Celebration';
afterEach(cleanup);
it('renders a canvas with color + params', () => {
  const { container } = render(<div style={{ width: 300, height: 200 }}><Celebration color="#FE5100" params={{ density: 'high' }} /></div>);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
