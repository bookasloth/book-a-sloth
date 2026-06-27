import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import BackgroundCurator from '../BackgroundCurator';

afterEach(cleanup);

describe('BackgroundCurator', () => {
  it('renders a card per registry type and reflects enabled state', () => {
    const value = { backgrounds: { dotgrid: { enabled: true, order: 1, params: {} } }, default_background: 'dotgrid' };
    const { getByLabelText } = render(<BackgroundCurator value={value} onChange={() => {}} />);
    expect(getByLabelText(/enable dot grid/i).checked).toBe(true);
  });
  it('emits onChange when a type is toggled', () => {
    const onChange = vi.fn();
    const value = { backgrounds: {}, default_background: 'dotgrid' };
    const { getByLabelText } = render(<BackgroundCurator value={value} onChange={onChange} />);
    fireEvent.click(getByLabelText(/enable dot grid/i));
    expect(onChange).toHaveBeenCalled();
  });
});
