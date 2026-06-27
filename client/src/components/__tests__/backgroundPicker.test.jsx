import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import BackgroundPicker from '../BackgroundPicker';

afterEach(cleanup);
const enabled = [{ key: 'dotgrid', params: {} }, { key: 'galaxy', params: {} }];

describe('BackgroundPicker', () => {
  it('renders a card per enabled type plus a None option', () => {
    const { getByText } = render(<BackgroundPicker color="#FE5100" enabled={enabled} value="galaxy" onChange={() => {}} />);
    expect(getByText('Dot Grid')).toBeInTheDocument();
    expect(getByText('Galaxy')).toBeInTheDocument();
    expect(getByText(/none/i)).toBeInTheDocument();
  });
  it('calls onChange with the chosen key', () => {
    const onChange = vi.fn();
    const { getByText } = render(<BackgroundPicker color="#FE5100" enabled={enabled} value={null} onChange={onChange} />);
    fireEvent.click(getByText('Galaxy'));
    expect(onChange).toHaveBeenCalledWith('galaxy');
  });
});
