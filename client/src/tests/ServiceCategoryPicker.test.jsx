import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ServiceCategoryPicker from '../components/services/ServiceCategoryPicker';

const TWO = [
  { slug: 'career-coach', label: 'Career Coach' },
  { slug: 'life-coach', label: 'Life Coach' },
];

test('single category renders a read-only chip (no buttons)', () => {
  render(<ServiceCategoryPicker categories={[{ slug: 'career-coach', label: 'Career Coach' }]} value="career-coach" onChange={() => {}} />);
  expect(screen.getByText('Career Coach')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

test('multiple categories are selectable and fire onChange', () => {
  const onChange = vi.fn();
  render(<ServiceCategoryPicker categories={TWO} value="career-coach" onChange={onChange} />);
  fireEvent.click(screen.getByText('Life Coach'));
  expect(onChange).toHaveBeenCalledWith('life-coach');
});

test('renders nothing when the host has no categories', () => {
  const { container } = render(<ServiceCategoryPicker categories={[]} value="" onChange={() => {}} />);
  expect(container.firstChild).toBeNull();
});
