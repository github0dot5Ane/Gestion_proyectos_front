/// <reference types="cypress" />

describe('TaskForm Component', () => {
  const mockUsers = [
    { id: 1, nombre: 'Usuario 1' },
    { id: 2, nombre: 'Usuario 2' }
  ];

  const mockTask = {
    id: 1,
    titulo: 'Tarea existente',
    descripcion: 'Descripción de tarea',
    fecha_inicio: '2023-01-01 00:00:00',
    fecha_finalizacion: '2023-01-10 00:00:00',
    id_proyecto: 1,
    id_usuario: 1,
    status: 'En Progreso'
  };

  const mockOnSubmit = cy.stub().as('onSubmit');
  const mockOnCancel = cy.stub().as('onCancel');

  beforeEach(() => {
    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({
          users: {
            users: mockUsers,
            status: 'succeeded',
            error: null
          },
          tasks: {
            error: null
          }
        }),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de fetchUsers
    cy.stub('../../features/users/userSlice', 'fetchUsers').returns({ type: 'users/fetchUsers' });
    cy.stub('../../features/tasks/taskSlice', 'clearTaskError').returns({ type: 'tasks/clearError' });
  });

  context('Formulario para nueva tarea', () => {
    beforeEach(() => {
      cy.mount(<TaskForm projectId={1} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    });

    it('debe renderizar el formulario para nueva tarea', () => {
      cy.contains('Nueva Tarea').should('exist');
      cy.get('input[name="titulo"]').should('exist');
      cy.get('textarea[name="descripcion"]').should('exist');
      cy.get('select[name="id_usuario"]').should('exist');
      cy.get('select[name="status"]').should('exist');
      cy.contains('button', 'Crear tarea').should('exist');
      cy.contains('button', 'Cancelar').should('exist');
    });

    it('debe cargar los usuarios al montar', () => {
      cy.get('@dispatch').should('have.been.calledWith', fetchUsers());
    });

    it('debe asignar el primer usuario por defecto', () => {
      cy.get('select[name="id_usuario"]').should('have.value', '1');
    });

    it('debe validar campos requeridos', () => {
      cy.get('input[name="titulo"]').clear();
      cy.get('input[name="fecha_inicio"]').clear();
      cy.get('input[name="fecha_finalizacion"]').clear();
      cy.contains('button', 'Crear tarea').click();
      
      cy.contains('Todos los campos marcados como obligatorios (*) son requeridos').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });

    it('debe enviar el formulario con datos válidos', () => {
      const testData = {
        titulo: 'Nueva tarea',
        descripcion: 'Descripción de prueba',
        fecha_inicio: '2023-01-01',
        fecha_finalizacion: '2023-01-10',
        id_usuario: 2,
        status: 'Pendiente'
      };

      cy.get('input[name="titulo"]').type(testData.titulo);
      cy.get('textarea[name="descripcion"]').type(testData.descripcion);
      cy.get('input[name="fecha_inicio"]').type(testData.fecha_inicio);
      cy.get('input[name="fecha_finalizacion"]').type(testData.fecha_finalizacion);
      cy.get('select[name="id_usuario"]').select(testData.id_usuario.toString());
      cy.get('select[name="status"]').select(testData.status);
      cy.contains('button', 'Crear tarea').click();

      cy.get('@onSubmit').should('have.been.calledWith', {
        ...testData,
        id_proyecto: 1
      });
    });

    it('debe manejar la validación de fechas', () => {
      cy.get('input[name="fecha_inicio"]').type('2023-01-10');
      cy.get('input[name="fecha_finalizacion"]').should('have.attr', 'min', '2023-01-10');
      
      // Intentar fecha final anterior
      cy.get('input[name="fecha_finalizacion"]').type('2023-01-05');
      cy.get('input[name="fecha_finalizacion"]').should('have.value', '2023-01-10');
    });

    it('debe mostrar mensaje cuando no hay fecha inicio', () => {
      cy.get('input[name="fecha_inicio"]').clear();
      cy.get('input[name="fecha_finalizacion"]').should('be.disabled');
      cy.contains('Selecciona primero la fecha de inicio').should('exist');
    });

    it('debe llamar a onCancel al hacer clic en Cancelar', () => {
      cy.contains('button', 'Cancelar').click();
      cy.get('@onCancel').should('have.been.calledOnce');
    });
  });

  context('Formulario para editar tarea', () => {
    beforeEach(() => {
      cy.mount(
        <TaskForm 
          projectId={1} 
          task={mockTask} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );
    });

    it('debe renderizar el formulario para editar tarea', () => {
      cy.contains('Editar Tarea').should('exist');
      cy.get('input[name="titulo"]').should('have.value', mockTask.titulo);
      cy.get('textarea[name="descripcion"]').should('have.value', mockTask.descripcion);
      cy.get('input[name="fecha_inicio"]').should('have.value', '2023-01-01');
      cy.get('input[name="fecha_finalizacion"]').should('have.value', '2023-01-10');
      cy.get('select[name="id_usuario"]').should('have.value', mockTask.id_usuario.toString());
      cy.get('select[name="status"]').should('have.value', mockTask.status);
      cy.contains('button', 'Guardar cambios').should('exist');
    });

    it('debe enviar los cambios al formulario', () => {
      const updatedTitle = 'Tarea actualizada';
      cy.get('input[name="titulo"]').clear().type(updatedTitle);
      cy.contains('button', 'Guardar cambios').click();

      cy.get('@onSubmit').should('have.been.calledWith', {
        ...mockTask,
        titulo: updatedTitle,
        fecha_inicio: '2023-01-01',
        fecha_finalizacion: '2023-01-10'
      });
    });
  });

  context('Estados de carga y error', () => {
    it('debe mostrar spinner al enviar', () => {
      cy.mount(
        <TaskForm 
          projectId={1} 
          onSubmit={mockOnSubmit} 
          isLoading={true}
        />
      );
      
      cy.get('.animate-spin').should('exist');
      cy.contains('button', 'Crear tarea').should('be.disabled');
    });

    it('debe mostrar error si falla la carga de usuarios', () => {
      // Sobrescribir el mock para simular error
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            users: {
              users: [],
              status: 'failed',
              error: 'Error al cargar usuarios'
            }
          })
        };
      });

      cy.mount(<TaskForm projectId={1} onSubmit={mockOnSubmit} />);
      cy.contains('Error al cargar usuarios').should('exist');
      cy.get('select[name="id_usuario"]').should('be.disabled');
    });

    it('debe mostrar error de tarea si existe', () => {
      // Sobrescribir el mock para simular error
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            tasks: {
              error: 'Error al guardar tarea'
            }
          })
        };
      });

      cy.mount(<TaskForm projectId={1} onSubmit={mockOnSubmit} />);
      cy.contains('Error al guardar tarea').should('exist');
    });
  });

  context('Comportamiento responsive', () => {
    it('debe ajustar el layout en pantallas pequeñas', () => {
      cy.viewport(600, 800);
      cy.mount(<TaskForm projectId={1} onSubmit={mockOnSubmit} />);
      
      // Verificar que los campos se apilan verticalmente
      cy.get('.grid-cols-1').should('exist');
    });
  });
});