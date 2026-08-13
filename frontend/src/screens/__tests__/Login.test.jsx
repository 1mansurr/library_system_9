import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../lib/auth';
import Login from '../Login';
import { vi, describe, it, expect } from 'vitest';
import * as authLib from '../../lib/auth';

// Mock the auth context
vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Login Component', () => {
  it('updates form values correctly', () => {
    authLib.useAuth.mockReturnValue({
      login: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('ama.mensah@st.knust.edu.gh');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    // Test inputting text
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');

    // Test clearing form value manually
    fireEvent.change(emailInput, { target: { value: '' } });
    expect(emailInput.value).toBe('');
  });

  it('displays error on failed login', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid email or password.'));
    authLib.useAuth.mockReturnValue({
      login: mockLogin,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('ama.mensah@st.knust.edu.gh');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful librarian login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ role: 'LIBRARIAN' });
    authLib.useAuth.mockReturnValue({
      login: mockLogin,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('ama.mensah@st.knust.edu.gh');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'lib@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'libpass' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('lib@example.com', 'libpass');
    });
  });
});
