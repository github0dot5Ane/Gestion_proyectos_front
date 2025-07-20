/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminUserManagementPage from './AdminUserManagementPage';

// Estado simulado
const mockDispatch = vi.fn();
const mockUsers: any[] = [];

// Mocks de los selectores y acciones
vi.mock('../features/users/userSlice', () => ({
  fetchUsers: () => ({ type: 'users/fetchUsers' }),
  clearUserError: () => ({ type: 'users/clearUserError' }),
  selectAllUsers: () => mockUsers,
  selectUsersStatus: () => 'succeeded',
  selectUserError: () => null,
  selectUserForEdit: () => null,
}));

// Store simulado
const mockStore = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: mockDispatch,
};

describe('AdminUserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsers.length = 0; // limpia lista
  });

  test.skip('renderiza el título y el botón Crear Usuario', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <AdminUserManagementPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/gestión de usuarios/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
  });

  test('muestra mensaje de "No hay usuarios"', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <AdminUserManagementPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/no hay usuarios/i)).toBeInTheDocument();
  });

  test.skip('despacha fetchUsers y clearUserError en el montaje', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <AdminUserManagementPage />
        </MemoryRouter>
      </Provider>
    );

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'users/fetchUsers' }));
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'users/clearUserError' }));
  });

  test.skip('al hacer clic en "Crear Usuario" muestra el formulario', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <AdminUserManagementPage />
        </MemoryRouter>
      </Provider>
    );

    const crearBtn = screen.getByRole('button', { name: /crear usuario/i });
    fireEvent.click(crearBtn);

    expect(screen.getByText(/crear nuevo usuario/i)).toBeInTheDocument();
  });
});
