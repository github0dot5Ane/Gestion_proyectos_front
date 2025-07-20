/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import TaskForm from '../TaskForm';

// Mocks
const mockDispatch = vi.fn();
const mockUsers = [{ id: 1, nombre: 'Usuario 1' }];
const mockOnSubmit = vi.fn();

// Mocks de redux
vi.mock('../../../features/users/userSlice', () => ({
  selectAllUsers: () => mockUsers,
  selectUsersStatus: () => 'succeeded',
  fetchUsers: () => ({ type: 'users/fetchUsers' }),
}));

vi.mock('../../../features/tasks/taskSlice', () => ({
  selectTasksError: () => null,
  clearTaskError: () => ({ type: 'tasks/clearTaskError' }),
}));

// Store simulado corregido
const mockStore = {
  getState: () => ({
    tasks: { error: null }, // ← esto evita el error
    users: {
      users: mockUsers,
      status: 'succeeded',
    },
  }),
  subscribe: () => () => {},
  dispatch: mockDispatch,
};

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockClear();
  });

  test.skip('renderiza correctamente el formulario de creación', () => {
    render(
      <Provider store={mockStore as any}>
        <TaskForm projectId={1} onSubmit={mockOnSubmit} />
      </Provider>
    );

    expect(screen.getByText(/nueva tarea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha final/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asignar a/i)).toBeInTheDocument();
  });

  test('permite completar y enviar el formulario', () => {
    render(
      <Provider store={mockStore as any}>
        <TaskForm projectId={1} onSubmit={mockOnSubmit} />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Nueva tarea' } });
    fireEvent.change(screen.getByLabelText(/fecha inicio/i), { target: { value: '2025-07-20' } });
    fireEvent.change(screen.getByLabelText(/fecha final/i), { target: { value: '2025-07-21' } });
    fireEvent.change(screen.getByLabelText(/asignar a/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Nueva tarea',
      id_proyecto: 1,
      id_usuario: 1,
      fecha_inicio: '2025-07-20',
      fecha_finalizacion: '2025-07-21',
      status: 'Pendiente',
    }));
  });
});
