import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import BackgroundPicker from '../BackgroundPicker';

afterEach(cleanup);

describe('BackgroundPicker', () => {
  it('renders only the None option when no backgrounds enabled', () => {
    const { getByText, container } = render(<BackgroundPicker color="#FE5100" enabled={[]} value={null} onChange={() => {}} />);
    expect(getByText(/none/i)).toBeInTheDocument();
    expect(container.querySelectorAll('button').length).toBe(1);
  });
  it('calls onChange with null when None clicked', () => {
    const onChange = vi.fn();
    const { getByText } = render(<BackgroundPicker color="#FE5100" enabled={[]} value={null} onChange={onChange} />);
    fireEvent.click(getByText(/none/i));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
