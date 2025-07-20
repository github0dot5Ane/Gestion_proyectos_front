/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProjectListPage from './ProjectListPage';

// Estado simulado
const mockProjects: any[] = [];
const mockDispatch = vi.fn();

// Mocks de los selectores y acciones
vi.mock('../features/projects/projectSlice', () => ({
  fetchProjects: () => ({ type: 'projects/fetchProjects' }),
  deleteProject: () => ({ type: 'projects/deleteProject' }),
  clearProjectError: () => ({ type: 'projects/clearProjectError' }),
  createProject: () => ({ type: 'projects/createProject' }),
  selectAllProjects: () => mockProjects,
  selectProjectsStatus: () => 'idle',
  selectProjectsError: () => null,
}));

vi.mock('../features/auth/authSlice', () => ({
  selectIsAdmin: () => true,
}));

// Store mock
const mockStore = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: mockDispatch,
};

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjects.length = 0; // resetear lista
  });

  test('renderiza título y botón de crear proyecto si es admin', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <ProjectListPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/listado de proyectos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument();
  });

  test('muestra mensaje de "No hay proyectos"', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <ProjectListPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/no hay proyectos/i)).toBeInTheDocument();
    expect(screen.getByText(/crear primer proyecto/i)).toBeInTheDocument();
  });

  test('despacha fetchProjects y clearProjectError en el montaje', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <ProjectListPage />
        </MemoryRouter>
      </Provider>
    );

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'projects/fetchProjects' }));
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'projects/clearProjectError' }));
  });

  test.skip('al hacer clic en "crear proyecto" muestra el formulario', () => {
    render(
      <Provider store={mockStore as any}>
        <MemoryRouter>
          <ProjectListPage />
        </MemoryRouter>
      </Provider>
    );

    const crearBtn = screen.getByRole('button', { name: /crear proyecto/i });
    fireEvent.click(crearBtn);

    expect(screen.getByText(/crear nuevo proyecto/i)).toBeInTheDocument();
  });
});
