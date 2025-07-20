/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

// Mocks de Redux
vi.mock('../features/auth/authSlice', () => ({
  loginUser: vi.fn(() => ({ type: 'auth/loginUser' })),
  clearAuthError: vi.fn(() => ({ type: 'auth/clearAuthError' })),
  selectAuthStatus: vi.fn(() => 'idle'),
  selectAuthError: vi.fn(() => null),
  selectIsAuthenticated: vi.fn(() => false)
}));

// Mock del store
const mockStore = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: vi.fn()
};

// Mock de navigate y location
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} })
  };
});

describe('LoginPage', () => {
  test('renderiza el formulario de login', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('permite escribir en los inputs', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@correo.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    expect(emailInput.value).toBe('test@correo.com');
    expect(passwordInput.value).toBe('123456');
  });

  test.skip('envía el formulario al hacer submit', () => {
    const dispatchMock = vi.fn();
    const store = {
      ...mockStore,
      dispatch: dispatchMock
    };

    render(
      <Provider store={store as any}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'test@correo.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    expect(dispatchMock).toHaveBeenCalledTimes(2); // clearAuthError + loginUser
  });
});
