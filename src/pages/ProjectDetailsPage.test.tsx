/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import ProjectListPage from './ProjectListPage';
import { configureStore } from '@reduxjs/toolkit';

// Importar reducers reales o vacíos según sea necesario
// Tipos explícitos
type Project = {
  id: string;
  name: string;
};

describe('ProjectListPage (sin jest ni vi.mock)', () => {
  const renderWithState = ({
    projects = [],
    isAdmin = true,
    status = 'idle',
    error = null,
  }: {
    projects?: Project[];
    isAdmin?: boolean;
    status?: string;
    error?: string | null;
  }) => {
    // Reducer de prueba personalizado para inyectar estado
    const preloadedState = {
      auth: { isAdmin },
      projects: {
        projects,
        status,
        error,
      },
    };

    const store = configureStore({
      reducer: {
        auth: () => preloadedState.auth,
        projects: () => preloadedState.projects,
      },
    });

    return render(
      <Provider store={store}>
        <MemoryRouter>
          <ProjectListPage />
        </MemoryRouter>
      </Provider>
    );
  };

  test.skip('muestra mensaje si no hay proyectos', () => {
    renderWithState({ projects: [] });

    expect(screen.getByText(/no hay proyectos/i)).toBeInTheDocument();
    expect(screen.getByText(/crear primer proyecto/i)).toBeInTheDocument();
  });

  test.skip('muestra botón "Crear Proyecto" si el usuario es admin', () => {
    renderWithState({ isAdmin: true });

    expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument();
  });

  test('no muestra botón si no es admin', () => {
    renderWithState({ isAdmin: false });

    expect(screen.queryByRole('button', { name: /crear proyecto/i })).not.toBeInTheDocument();
  });

  test.skip('renderiza lista si hay proyectos', () => {
    renderWithState({
      projects: [
        { id: '1', name: 'Proyecto Alpha' },
        { id: '2', name: 'Proyecto Beta' },
      ],
    });

    expect(screen.getByText(/proyecto alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/proyecto beta/i)).toBeInTheDocument();
  });
});
