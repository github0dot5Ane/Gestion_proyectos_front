/// <reference types="cypress" />

describe('TaskList Component', () => {
  const mockTasks = [
    {
      id: 1,
      titulo: 'Tarea 1',
      descripcion: 'Descripción tarea 1',
      fecha_inicio: '2023-01-01T00:00:00',
      fecha_finalizacion: '2023-01-10T00:00:00',
      id_proyecto: 1,
      id_usuario: 1,
      usuario: { nombre: 'Usuario 1' },
      status: 'Pendiente'
    },
    {
      id: 2,
      titulo: 'Tarea 2',
      descripcion: 'Descripción tarea 2',
      fecha_inicio: '2023-02-01T00:00:00',
      fecha_finalizacion: '2023-02-15T00:00:00',
      id_proyecto: 1,
      id_usuario: 2,
      usuario: { nombre: 'Usuario 2' },
      status: 'En Progreso'
    }
  ];

  const mockCurrentUser = { id: 1, nombre: 'Usuario 1' };
  const mockCurrentProject = { id: 1, id_responsable: 1 };

  beforeEach(() => {
    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({
          auth: {
            isAdmin: false,
            currentUser: mockCurrentUser
          },
          projects: {
            currentProject: mockCurrentProject
          }
        }),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de las acciones
    cy.stub('../../features/tasks/taskSlice', 'updateTask').returns({ type: 'tasks/updateTask' });
    cy.stub('../../features/tasks/taskSlice', 'deleteTask').returns({ type: 'tasks/deleteTask' });
  });

  context('Estado de carga', () => {
    it('debe mostrar spinner cuando está cargando', () => {
      cy.mount(<TaskList tasks={[]} isLoading={true} />);
      cy.get('.animate-spin').should('exist');
    });
  });

  context('Estado de error', () => {
    it('debe mostrar mensaje de error cuando hay error', () => {
      const errorMessage = 'Error al cargar tareas';
      cy.mount(<TaskList tasks={[]} isLoading={false} error={errorMessage} />);
      cy.contains('Error al cargar tareas').should('exist');
      cy.contains(errorMessage).should('exist');
    });
  });

  context('Lista vacía', () => {
    it('debe mostrar mensaje cuando no hay tareas', () => {
      cy.mount(<TaskList tasks={[]} isLoading={false} />);
      cy.contains('No hay tareas').should('exist');
      cy.contains('No se encontraron tareas para mostrar').should('exist');
    });
  });

  context('Lista con tareas', () => {
    beforeEach(() => {
      cy.mount(<TaskList tasks={mockTasks} isLoading={false} />);
    });

    it('debe mostrar las tareas correctamente', () => {
      cy.contains('Tarea 1').should('exist');
      cy.contains('Tarea 2').should('exist');
      cy.contains('Descripción tarea 1').should('exist');
      cy.contains('Usuario 1').should('exist');
      cy.contains('01/01/2023').should('exist');
    });

    it('debe mostrar los selectores de estado con los valores correctos', () => {
      cy.get('select').first().should('have.value', 'Pendiente');
      cy.get('select').eq(1).should('have.value', 'En Progreso');
    });

    it('debe mostrar los botones de acción correctamente', () => {
      // Botón de archivos
      cy.get('[title="Gestionar archivos"]').should('have.length', 2);
      
      // Botón de editar (solo visible para tareas editables)
      cy.get('[title="Editar detalles"]').should('exist');
      
      // Botón de eliminar (solo visible para tareas eliminables)
      cy.get('[title="Eliminar tarea"]').should('exist');
    });

    it('debe abrir el modal de archivos al hacer clic', () => {
      cy.get('[title="Gestionar archivos"]').first().click();
      // Verificar que se establece la tarea seleccionada
      cy.window().its('TaskFilesModal').should('exist');
    });

    it('debe permitir cambiar el estado de la tarea', () => {
      cy.get('select').first().select('Completada');
      cy.get('@dispatch').should('have.been.calledWith', {
        type: 'tasks/updateTask',
        payload: { taskId: '1', taskData: { status: 'Completada' } }
      });
    });

    it('debe mostrar confirmación al eliminar tarea', () => {
      cy.stub(window, 'confirm').returns(false);
      cy.get('[title="Eliminar tarea"]').first().click();
      expect(window.confirm).to.have.been.calledWith('¿Seguro que quieres eliminar esta tarea?');
    });

    it('debe llamar a deleteTask al confirmar eliminación', () => {
      cy.stub(window, 'confirm').returns(true);
      cy.get('[title="Eliminar tarea"]').first().click();
      cy.get('@dispatch').should('have.been.calledWith', {
        type: 'tasks/deleteTask',
        payload: '1'
      });
    });
  });

  context('Permisos de usuario', () => {
    it('debe mostrar botones de edición solo para responsables o admins', () => {
      // Usuario no responsable
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              isAdmin: false,
              currentUser: { id: 3 } // Usuario diferente
            }
          })
        };
      });

      cy.mount(<TaskList tasks={mockTasks} isLoading={false} />);
      cy.get('[title="Editar detalles"]').should('not.exist');
      cy.get('[title="Eliminar tarea"]').should('not.exist');
    });

    it('debe permitir cambiar estado para usuario asignado', () => {
      // Usuario asignado a la tarea
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              isAdmin: false,
              currentUser: { id: 2 } // Usuario asignado a la segunda tarea
            }
          })
        };
      });

      cy.mount(<TaskList tasks={mockTasks} isLoading={false} />);
      cy.get('select').eq(1).should('not.be.disabled');
    });

    it('debe mostrar todos los botones para admin', () => {
      // Usuario admin
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              isAdmin: true,
              currentUser: { id: 3 } // Usuario admin
            }
          })
        };
      });

      cy.mount(<TaskList tasks={mockTasks} isLoading={false} />);
      cy.get('[title="Editar detalles"]').should('have.length', 2);
      cy.get('[title="Eliminar tarea"]').should('have.length', 2);
    });
  });
});