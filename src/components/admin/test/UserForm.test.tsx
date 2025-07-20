// src/components/admin/UserForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import UserForm from '../UserForm';
import { vi } from 'vitest';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';

// Mocks de Redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(),
    useDispatch: vi.fn(),
  };
});

const mockDispatch = vi.fn();
// @ts-ignore
(useDispatch as vi.Mock).mockReturnValue(mockDispatch);

describe('UserForm', () => {
  const mockSubmit = vi.fn();
  const mockCancel = vi.fn();

  const renderComponent = ({
    user = null,
    error = null,
    status = 'idle',
  }: {
    user?: any;
    error?: string | null;
    status?: 'idle' | 'loading' | 'succeeded' | 'failed';
  } = {}) => {

    // @ts-ignore
    (useSelector as unknown as vi.MockInstance<any, [any]>).mockImplementation((selector: (state: any) => any) => {
      if (selector.name === 'selectUsersStatus') return status;
      if (selector.name === 'selectUserError') return error;
      return null;
    });

    const store = configureStore({ reducer: () => ({}) });

    render(
      <Provider store={store}>
        <UserForm user={user} onSubmit={mockSubmit} onCancel={mockCancel} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('muestra un alert si la contraseña tiene menos de 8 caracteres', async () => {
    window.alert = vi.fn();
    renderComponent();

    await userEvent.type(screen.getByLabelText(/nombre completo/i), 'Luis');
    await userEvent.type(screen.getByLabelText(/email/i), 'luis@test.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), '12345');

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    expect(window.alert).toHaveBeenCalledWith('La contraseña debe tener al menos 8 caracteres.');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('muestra mensaje de error si existe error en redux', () => {
    renderComponent({ error: 'Ya existe el email' });

    expect(screen.getByText(/error: ya existe el email/i)).toBeInTheDocument();
  });

  it('muestra datos iniciales al editar', () => {
    const user = {
      id: 5,
      nombre: 'Admin',
      email: 'admin@test.com',
      telefono: '123123123',
      estado: true,
      admin: true,
    };

    renderComponent({ user });

    expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123123123')).toBeInTheDocument();

    // Contraseña no visible
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
  });

  it('llama a onCancel cuando se presiona el botón Cancelar', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockCancel).toHaveBeenCalled();
  });
});
