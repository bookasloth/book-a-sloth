/**
 * tests/Products.test.jsx
 * Vitest: oversized product file blocked pre-submit (no upload call);
 * thumbnail live-preview renders from a pasted image URL.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getMyProducts: vi.fn().mockResolvedValue({ data: [] }),
  createProduct: vi.fn().mockResolvedValue({ data: {} }),
  updateProduct: vi.fn().mockResolvedValue({ data: {} }),
  deleteProduct: vi.fn().mockResolvedValue({ data: {} }),
  uploadProductFile: vi.fn().mockResolvedValue({ data: { url: 'https://cdn/x.pdf', name: 'x.pdf', size: 10 } }),
  uploadImage: vi.fn().mockResolvedValue({ data: { url: 'https://cdn/thumb.png' } }),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/common/BackButton', () => ({ default: () => <div>Back</div> }));

import { useAuth } from '../context/AuthContext';
import { uploadProductFile } from '../services/api';
import Products from '../pages/Products';

// Reset mock call-counts before every test so assertions like
// expect(uploadProductFile).not.toHaveBeenCalled() cannot false-positive
// from a prior test's call. clearAllMocks leaves mockResolvedValue
// implementations intact, so no re-establishment is needed.
beforeEach(() => {
  vi.clearAllMocks();
});

// jsdom has no URL.createObjectURL; the thumbnail-upload preview uses it.
beforeAll(() => {
  if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:preview';
  else vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
});

const renderProducts = async (plan = 'creator') => {
  useAuth.mockReturnValue({ user: { plan }, updateUser: vi.fn() });
  render(<MemoryRouter><Products /></MemoryRouter>);
  // Wait for the initial fetchProducts() effect to settle.
  await waitFor(() => expect(screen.getByText(/Digital Products/i)).toBeTruthy());
};

const openForm = async () => {
  const u = userEvent.setup();
  await u.click(screen.getByRole('button', { name: /add product/i }));
  await waitFor(() => expect(screen.getByText(/New Product/i)).toBeTruthy());
  return u;
};

describe('Products — file upload guard', () => {
  test('blocks an oversized (>2MB) file before calling uploadProductFile', async () => {
    await renderProducts('creator');
    await openForm();

    // Build a >2MB pdf File.
    const bigData = new Uint8Array(2 * 1024 * 1024 + 1);
    const bigFile = new File([bigData], 'big.pdf', { type: 'application/pdf' });

    const fileInput = document.querySelector('input[type="file"][data-testid="product-file-input"]');
    expect(fileInput).toBeTruthy();
    await fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(uploadProductFile).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/under 2\s*MB/i)).toBeTruthy());
  });

  test('blocks a disallowed extension (.exe) before calling uploadProductFile', async () => {
    await renderProducts('creator');
    await openForm();

    const badFile = new File(['x'], 'malware.exe', { type: 'application/octet-stream' });
    const fileInput = document.querySelector('input[type="file"][data-testid="product-file-input"]');
    await fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(uploadProductFile).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/not supported|allowed/i)).toBeTruthy());
  });
});

describe('Products — thumbnail by URL', () => {
  test('renders a live preview img when an image URL is pasted', async () => {
    await renderProducts('creator');
    const u = await openForm();

    const urlInput = screen.getByPlaceholderText(/https:\/\/\.\.\.|paste an image url/i);
    await u.type(urlInput, 'https://cdn.example/cover.png');

    await waitFor(() => {
      const preview = document.querySelector('img[alt="Thumbnail preview"]');
      expect(preview).toBeTruthy();
      expect(preview.getAttribute('src')).toBe('https://cdn.example/cover.png');
    });
  });
});
