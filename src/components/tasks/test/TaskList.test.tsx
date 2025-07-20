/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import TaskList from '../TaskList';
import { vi } from 'vitest';

// Tipos locales solo para el test
type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';

interface User {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  admin: boolean;
}

interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_finalizacion: string;
  id_proyecto: number;
  id_usuario: number;
  usuario?: User;
  status: TaskStatus;
}

// Mocks Redux
const mockDispatch = vi.fn();
const mockStore = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: mockDispatch,
};

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: vi.fn((selector) => {
      if (selector.name === 'selectIsAdmin') return true;
      if (selector.name === 'selectCurrentUser') return {
        id: 1,
        nombre: 'Usuario 1',
        email: 'usuario1@example.com',
        estado: true,
        admin: false,
      };
      if (selector.name === 'selectCurrentProject') return { id: 1, id_responsable: 1 };
      return selector();
    }),
  };
});

vi.mock('../../features/tasks/taskSlice', () => ({
  updateTask: vi.fn(({ taskId, taskData }) => ({
    type: 'tasks/updateTask',
    payload: { taskId, taskData },
    unwrap: () => Promise.resolve(),
  })),
  deleteTask: vi.fn((id) => ({
    type: 'tasks/deleteTask',
    payload: id,
    unwrap: () => Promise.resolve(),
  })),
}));

const tasks: Task[] = [
  {
    id: 101,
    titulo: 'Tarea A',
    descripcion: 'Desc A',
    fecha_inicio: '2025-07-19',
    fecha_finalizacion: '2025-07-21',
    id_proyecto: 1,
    id_usuario: 1,
    usuario: {
      id: 1,
      nombre: 'Usuario 1',
      email: 'usuario1@example.com',
      estado: true,
      admin: false,
    },
    status: 'Pendiente',
  },
];

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra mensaje de error si error está presente', () => {
    render(
      <Provider store={mockStore as any}>
        <TaskList tasks={[]} isLoading={false} error="Falló" />
      </Provider>
    );
    expect(screen.getByText(/error al cargar tareas/i)).toBeInTheDocument();
    expect(screen.getByText(/falló/i)).toBeInTheDocument();
  });

  it('muestra mensaje si no hay tareas', () => {
    render(
      <Provider store={mockStore as any}>
        <TaskList tasks={[]} isLoading={false} />
      </Provider>
    );
    expect(screen.getByText(/no hay tareas/i)).toBeInTheDocument();
  });

  it('renderiza una tarea correctamente', () => {
    render(
      <Provider store={mockStore as any}>
        <TaskList tasks={tasks} isLoading={false} />
      </Provider>
    );
    expect(screen.getByText('Tarea A')).toBeInTheDocument();
    expect(screen.getByText('Desc A')).toBeInTheDocument();
  });

  it('no elimina la tarea si no se confirma', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    render(
      <Provider store={mockStore as any}>
        <TaskList tasks={tasks} isLoading={false} />
      </Provider>
    );

    fireEvent.click(screen.getByTitle('Eliminar tarea'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
