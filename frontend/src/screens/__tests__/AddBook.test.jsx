import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddBook from '../AddBook';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as apiLib from '../../lib/api';
import { AuthProvider } from '../../lib/auth';

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../../components/Toast', () => ({
  useToast: () => vi.fn(),
}));

describe('AddBook Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('library_user', JSON.stringify({ role: 'LIBRARIAN', full_name: 'Test Librarian' }));
    localStorage.setItem('library_jwt', 'fake-token');
    
    apiLib.apiFetch.mockImplementation(async (url) => {
      if (url === '/api/colleges') return [{ college_id: 'c1', name: 'Science' }];
      if (url.includes('/departments')) return [{ department_id: 'd1', name: 'Computer Science' }];
      if (url.includes('/courses')) return [{ course_id: 'co1', name: 'BSc Computer Science' }];
      return [];
    });
  });

  it('updates input values and clears them using the clear button', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AddBook />
        </AuthProvider>
      </BrowserRouter>
    );

    const isbnInput = screen.getByPlaceholderText('978-…');
    const titleInput = screen.getByPlaceholderText('Book title');
    const authorInput = screen.getByPlaceholderText('Author name');

    // Type into inputs
    fireEvent.change(isbnInput, { target: { value: '123456789' } });
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });

    expect(isbnInput.value).toBe('123456789');
    expect(titleInput.value).toBe('Test Book');
    expect(authorInput.value).toBe('Test Author');

    // Click clear button
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(isbnInput.value).toBe('');
    expect(titleInput.value).toBe('');
    expect(authorInput.value).toBe('');
  });

  it('validates empty form submission', async () => {
    render(
      <BrowserRouter>
        <AddBook />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /save & add copies/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('ISBN, title and author are required.')).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    apiLib.apiFetch.mockImplementation(async (url, options) => {
      if (url === '/api/colleges') return [{ college_id: 'c1', name: 'Science' }];
      if (options?.method === 'POST') return { book_id: 'b1' };
      return [];
    });

    render(
      <BrowserRouter>
        <AddBook />
      </BrowserRouter>
    );

    const isbnInput = screen.getByPlaceholderText('978-…');
    const titleInput = screen.getByPlaceholderText('Book title');
    const authorInput = screen.getByPlaceholderText('Author name');
    const submitBtn = screen.getByRole('button', { name: /save & add copies/i });

    fireEvent.change(isbnInput, { target: { value: '123456789' } });
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiLib.apiFetch).toHaveBeenCalledWith('/api/books', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ isbn: '123456789', title: 'Test Book', author: 'Test Author' })
      }));
    });
  });
});
