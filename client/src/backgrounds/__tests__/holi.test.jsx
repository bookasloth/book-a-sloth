import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Holi from '../engines/Holi';
afterEach(cleanup);
it('renders a canvas with color + params', () => {
  const { container } = render(<div style={{ width: 300, height: 200 }}><Holi color="#FE5100" params={{ intensity: 'vivid' }} /></div>);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
