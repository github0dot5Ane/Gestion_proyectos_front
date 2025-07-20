/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import MyTasksPage from './MyTasksPage';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import * as taskSlice from '../features/tasks/taskSlice';

vi.mock('../features/tasks/taskSlice', async () => {
  const actual = await vi.importActual<typeof import('../features/tasks/taskSlice')>(
    '../features/tasks/taskSlice'
  );
  return {
    ...actual,
    fetchTasks: vi.fn(() => ({ type: 'tasks/fetchTasks' })),
    clearTasks: vi.fn(() => ({ type: 'tasks/clearTasks' })),
    selectAllTasks: vi.fn(() => []),
    selectTasksStatus: vi.fn(() => 'idle'),
    selectTasksError: vi.fn(() => null),
  };
});

const mockStore = {
  getState: () => ({
    auth: { user: { admin: false } }, // <-- esto evita el error de "reading 'user'"
  }),
  subscribe: () => () => {},
  dispatch: vi.fn(),
};

describe('MyTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskSlice.selectAllTasks).mockReturnValue([]);
    vi.mocked(taskSlice.selectTasksStatus).mockReturnValue('idle');
    vi.mocked(taskSlice.selectTasksError).mockReturnValue(null);
  });

  test.skip('renderiza el título y subtítulo correctamente', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <MyTasksPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/mis tareas asignadas/i)).toBeInTheDocument();
    expect(screen.getByText(/lista de todas las tareas asignadas a ti/i)).toBeInTheDocument();
  });

  test.skip('renderiza mensaje de "No hay tareas" si no hay tareas y no está cargando', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <MyTasksPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/no hay tareas asignadas/i)).toBeInTheDocument();
    expect(screen.getByText(/no se encontraron tareas/i)).toBeInTheDocument();
  });

  test('muestra spinner si está cargando y no hay tareas', () => {
    vi.mocked(taskSlice.selectTasksStatus).mockReturnValue('loading');

    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <MyTasksPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument(); // usa data-testid
  });

    

});
