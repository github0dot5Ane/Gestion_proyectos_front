/// <reference types="cypress" />

describe('ProjectListPage', () => {
  const mockProjects = [
    {
      id: 1,
      titulo: 'Proyecto 1',
      descripcion: 'Descripción del proyecto 1',
      fecha_inicio: '2023-01-01',
      fecha_finalizacion: '2023-12-31'
    },
    {
      id: 2,
      titulo: 'Proyecto 2',
      descripcion: 'Descripción del proyecto 2',
      fecha_inicio: '2023-02-01',
      fecha_finalizacion: '2023-11-30'
    }
  ];

  beforeEach(() => {
    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({
          projects: {
            projects: mockProjects,
            status: 'succeeded',
            error: null
          },
          auth: {
            isAdmin: true
          }
        }),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de react-router
    cy.stub(window, 'ReactRouterDom').callsFake(() => ({
      Link: ({ children, to }) => <a href={to}>{children}</a>,
      // Mantener otras funcionalidades
      ...window.ReactRouterDom
    }));

    // Mock de API
    cy.intercept('GET', '/api/projects', {
      statusCode: 200,
      body: mockProjects
    }).as('getProjects');

    cy.intercept('POST', '/api/projects', {
      statusCode: 200,
      body: { id: 3, titulo: 'Nuevo proyecto' }
    }).as('createProject');

    cy.intercept('DELETE', '/api/projects/*', {
      statusCode: 200
    }).as('deleteProject');
  });

  context('Carga inicial', () => {
    it('debe cargar los proyectos al montar', () => {
      cy.mount(<ProjectListPage />);
      cy.get('@dispatch').should('have.been.calledWith', fetchProjects());
    });

    it('debe mostrar spinner mientras carga', () => {
      // Sobrescribir el mock para simular carga
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              projects: [],
              status: 'loading',
              error: null
            }
          })
        };
      });

      cy.mount(<ProjectListPage />);
      cy.get('.animate-spin').should('exist');
      cy.contains('Cargando proyectos...').should('exist');
    });

    it('debe mostrar error si falla la carga', () => {
      // Sobrescribir el mock para simular error
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              projects: [],
              status: 'failed',
              error: 'Error al cargar proyectos'
            }
          })
        };
      });

      cy.mount(<ProjectListPage />);
      cy.contains('Error al cargar proyectos').should('exist');
      cy.contains('button', 'Reintentar').should('exist');
    });

    it('debe mostrar mensaje si no hay proyectos', () => {
      // Sobrescribir el mock para simular lista vacía
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              projects: [],
              status: 'succeeded',
              error: null
            }
          })
        };
      });

      cy.mount(<ProjectListPage />);
      cy.contains('No hay proyectos').should('exist');
      cy.contains('Crear primer proyecto').should('exist');
    });
  });

  context('Visualización de proyectos', () => {
    beforeEach(() => {
      cy.mount(<ProjectListPage />);
    });

    it('debe mostrar la lista de proyectos', () => {
      cy.contains('Listado de Proyectos').should('exist');
      cy.contains('Proyecto 1').should('exist');
      cy.contains('Proyecto 2').should('exist');
      cy.contains('Descripción del proyecto 1').should('exist');
    });

    it('debe mostrar las fechas correctamente formateadas', () => {
      cy.contains('01/01/2023').should('exist'); // Formato de fecha local
      cy.contains('31/12/2023').should('exist');
    });

    it('debe mostrar botón de crear proyecto si es admin', () => {
      cy.contains('button', 'Crear Proyecto').should('exist');
    });

    it('no debe mostrar botón de crear proyecto si no es admin', () => {
      // Sobrescribir el mock para simular no admin
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              isAdmin: false
            }
          })
        };
      });

      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Crear Proyecto').should('not.exist');
    });
  });

  context('Creación de proyectos', () => {
    it('debe mostrar el formulario al hacer clic en Crear Proyecto', () => {
      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Crear Proyecto').click();
      cy.contains('Crear Nuevo Proyecto').should('exist');
      cy.contains('button', 'Cancelar').should('exist');
    });

    it('debe llamar a createProject al enviar el formulario', () => {
      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Crear Proyecto').click();
      
      // Simular llenado del formulario
      cy.get('input[name="titulo"]').type('Nuevo proyecto');
      cy.contains('button', 'Guardar').click();
      
      cy.get('@dispatch').should('have.been.calledWith', 
        createProject({ titulo: 'Nuevo proyecto' })
      );
    });
  });

  context('Eliminación de proyectos', () => {
    it('debe mostrar confirmación al intentar eliminar', () => {
      cy.stub(window, 'confirm').returns(false);
      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Eliminar').first().click();
      expect(window.confirm).to.have.been.calledWith(
        '¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.'
      );
    });

    it('debe llamar a deleteProject al confirmar eliminación', () => {
      cy.stub(window, 'confirm').returns(true);
      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Eliminar').first().click();
      
      cy.get('@dispatch').should('have.been.calledWith', deleteProject('1'));
    });

    it('debe mostrar estado de carga durante la eliminación', () => {
      cy.stub(window, 'confirm').returns(true);
      cy.mount(<ProjectListPage />);
      cy.contains('button', 'Eliminar').first().click();
      
      cy.contains('Eliminando...').should('exist');
      cy.get('.animate-spin').should('exist');
    });
  });

  context('Navegación', () => {
    it('debe navegar al detalle del proyecto al hacer clic', () => {
      cy.mount(<ProjectListPage />);
      cy.contains('Proyecto 1').click();
      // Verificar que se navega a la URL correcta
      cy.location('pathname').should('eq', '/projects/1');
    });
  });
});