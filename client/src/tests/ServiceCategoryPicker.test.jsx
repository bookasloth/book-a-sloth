import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ServiceCategoryPicker from '../components/services/ServiceCategoryPicker';

const SVC = [
  { id: '1', slug: 'wedding-photography', name: 'Wedding Photography' },
  { id: '2', slug: 'portrait-photography', name: 'Portrait Photography' },
];

test('renders a selectable chip per service category', () => {
  render(<ServiceCategoryPicker categories={SVC} value="wedding-photography" onChange={() => {}} />);
  expect(screen.getByText('Wedding Photography')).toBeTruthy();
  expect(screen.getByText('Portrait Photography')).toBeTruthy();
});

test('clicking a category fires onChange with its slug', () => {
  const onChange = vi.fn();
  render(<ServiceCategoryPicker categories={SVC} value="wedding-photography" onChange={onChange} />);
  fireEvent.click(screen.getByText('Portrait Photography'));
  expect(onChange).toHaveBeenCalledWith('portrait-photography');
});

test('renders nothing when the profession has no service categories', () => {
  const { container } = render(<ServiceCategoryPicker categories={[]} value="" onChange={() => {}} />);
  expect(container.firstChild).toBeNull();
});
