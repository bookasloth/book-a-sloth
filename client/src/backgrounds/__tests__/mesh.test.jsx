import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import MeshGradient from '../engines/MeshGradient';
afterEach(cleanup);
it('renders a canvas with color + params', () => {
  const { container } = render(<div style={{ width: 300, height: 200 }}><MeshGradient color="#FE5100" params={{ blur: 'med' }} /></div>);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
