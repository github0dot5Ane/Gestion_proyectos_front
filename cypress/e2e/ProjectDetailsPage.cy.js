/// <reference types="cypress" />

describe('ProjectDetailsPage', () => {
  const mockProject = {
    id: '1',
    titulo: 'Proyecto de prueba',
    descripcion: 'Descripción del proyecto',
    id_responsable: 'user1',
    responsable: { nombre: 'Usuario Responsable' },
    fecha_inicio: '2023-01-01',
    fecha_finalizacion: '2023-12-31'
  };

  const mockTasks = [
    { id: '1', titulo: 'Tarea 1', estado: 'pendiente' },
    { id: '2', titulo: 'Tarea 2', estado: 'en_progreso' }
  ];

  const mockFiles = [
    { id: 1, nombre_original: 'document.pdf', tipo_archivo: 'application/pdf', tamano: 1024 }
  ];

  beforeEach(() => {
    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({
          projects: {
            currentProject: mockProject,
            status: 'succeeded',
            error: null
          },
          tasks: {
            tasks: mockTasks,
            status: 'idle',
            error: null
          },
          auth: {
            currentUser: { id: 'user1' },
            isAdmin: false
          }
        }),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de react-router
    cy.stub(window, 'ReactRouterDom').callsFake(() => ({
      useParams: () => ({ projectId: '1' }),
      useNavigate: () => cy.stub().as('navigate'),
      Link: ({ children }) => children,
      // Mantener otras funcionalidades
      ...window.ReactRouterDom
    }));

    // Mock de API de archivos
    cy.intercept('GET', '/api/projects/1/files', {
      statusCode: 200,
      body: mockFiles
    }).as('getProjectFiles');

    cy.intercept('POST', '/api/projects/1/files', {
      statusCode: 200
    }).as('uploadFiles');

    cy.intercept('DELETE', '/api/projects/1/files/1', {
      statusCode: 200
    }).as('deleteFile');

    cy.intercept('GET', '/api/projects/1/files/1/download', {
      statusCode: 200
    }).as('downloadFile');
  });

  context('Carga inicial', () => {
    it('debe cargar el proyecto y sus tareas', () => {
      cy.mount(<ProjectDetailsPage />);
      
      cy.get('@dispatch').should('have.been.calledWith', fetchProjectById('1'));
      cy.get('@dispatch').should('have.been.calledWith', fetchTasks({ projectId: '1' }));
    });

    it('debe mostrar el spinner mientras carga', () => {
      // Sobrescribir el mock para simular carga
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              currentProject: null,
              status: 'loading',
              error: null
            }
          })
        };
      });

      cy.mount(<ProjectDetailsPage />);
      cy.get('.animate-spin').should('exist');
    });

    it('debe mostrar error si falla la carga', () => {
      // Sobrescribir el mock para simular error
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              currentProject: null,
              status: 'failed',
              error: 'Error al cargar el proyecto'
            }
          })
        };
      });

      cy.mount(<ProjectDetailsPage />);
      cy.contains('Error al cargar el proyecto').should('exist');
      cy.contains('Volver a la lista de proyectos').should('exist');
    });

    it('debe mostrar mensaje si el proyecto no existe', () => {
      // Sobrescribir el mock para simular proyecto no encontrado
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            projects: {
              currentProject: null,
              status: 'succeeded',
              error: null
            }
          })
        };
      });

      cy.mount(<ProjectDetailsPage />);
      cy.contains('Proyecto no encontrado').should('exist');
    });
  });

  context('Visualización de detalles', () => {
    beforeEach(() => {
      cy.mount(<ProjectDetailsPage />);
    });

    it('debe mostrar los detalles del proyecto', () => {
      cy.contains(mockProject.titulo).should('exist');
      cy.contains(mockProject.descripcion).should('exist');
      cy.contains('Usuario Responsable').should('exist');
      cy.contains('01/01/2023').should('exist'); // Formato de fecha local
      cy.contains('31/12/2023').should('exist');
    });

    it('debe mostrar el botón de editar si el usuario es responsable', () => {
      cy.contains('button', 'Editar').should('exist');
    });

    it('no debe mostrar el botón de eliminar si el usuario no es admin', () => {
      cy.contains('button', 'Eliminar').should('not.exist');
    });

    it('debe mostrar el botón de eliminar si el usuario es admin', () => {
      // Sobrescribir el mock para simular admin
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              currentUser: { id: 'admin' },
              isAdmin: true
            }
          })
        };
      });

      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Eliminar').should('exist');
    });
  });

  context('Modo edición', () => {
    it('debe mostrar el formulario de edición al hacer clic en Editar', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Editar').click();
      cy.contains('Editando Proyecto:').should('exist');
      cy.contains('button', 'Cancelar').should('exist');
      cy.contains('button', 'Guardar').should('exist');
    });

    it('debe llamar a updateProject al enviar el formulario', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Editar').click();
      
      // Simular cambios en el formulario
      cy.get('input[name="titulo"]').clear().type('Nuevo título');
      cy.contains('button', 'Guardar').click();
      
      cy.get('@dispatch').should('have.been.calledWith', 
        updateProject({ projectId: '1', projectData: { titulo: 'Nuevo título' } })
      );
    });
  });

  context('Eliminación de proyecto', () => {
    beforeEach(() => {
      // Sobrescribir el mock para simular admin
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            auth: {
              currentUser: { id: 'admin' },
              isAdmin: true
            }
          })
        };
      });
    });

    it('debe mostrar confirmación al intentar eliminar', () => {
      cy.stub(window, 'confirm').returns(false);
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Eliminar').click();
      expect(window.confirm).to.have.been.calledWith(
        '¿Estás seguro de que quieres eliminar este proyecto? Esta acción es irreversible.'
      );
    });

    it('debe llamar a deleteProject y navegar al confirmar', () => {
      cy.stub(window, 'confirm').returns(true);
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Eliminar').click();
      
      cy.get('@dispatch').should('have.been.calledWith', deleteProject('1'));
      cy.get('@navigate').should('have.been.calledWith', '/projects');
    });
  });

  context('Gestión de tareas', () => {
    it('debe mostrar la lista de tareas', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('Tareas del Proyecto').should('exist');
      cy.contains('Tarea 1').should('exist');
      cy.contains('Tarea 2').should('exist');
    });

    it('debe mostrar el botón para añadir tarea si el usuario es responsable', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Añadir Tarea').should('exist');
    });

    it('debe mostrar el formulario de tarea al hacer clic en Añadir Tarea', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Añadir Tarea').click();
      cy.contains('form').should('exist');
      cy.contains('button', 'Cancelar').should('exist');
    });

    it('debe llamar a createTask al enviar el formulario de tarea', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.contains('button', 'Añadir Tarea').click();
      
      // Simular creación de tarea
      cy.get('input[name="titulo"]').type('Nueva tarea');
      cy.contains('button', 'Crear Tarea').click();
      
      cy.get('@dispatch').should('have.been.calledWith', 
        createTask({ titulo: 'Nueva tarea', projectId: '1' })
      );
    });
  });

  context('Gestión de archivos', () => {
    it('debe cargar los archivos del proyecto', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.wait('@getProjectFiles');
      cy.contains('Archivos del Proyecto').should('exist');
      cy.contains('document.pdf').should('exist');
    });

    it('debe mostrar el componente FileUpload si el usuario es responsable', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.get('[data-testid="file-upload"]').should('exist');
    });

    it('debe llamar a uploadProjectFiles al subir archivos', () => {
      cy.mount(<ProjectDetailsPage />);
      
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const event = { dataTransfer: { files: [file] } };
      
      cy.get('input[type="file"]').selectFile([file], { force: true });
      cy.contains('button', 'Subir Archivos').click();
      
      cy.wait('@uploadFiles').then((interception) => {
        expect(interception.request.body).to.exist;
      });
    });

    it('debe llamar a deleteProjectFile al eliminar un archivo', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.wait('@getProjectFiles');
      
      cy.stub(window, 'confirm').returns(true);
      cy.get('[title="Eliminar"]').first().click();
      
      cy.wait('@deleteFile');
    });

    it('debe llamar a downloadProjectFile al descargar un archivo', () => {
      cy.mount(<ProjectDetailsPage />);
      cy.wait('@getProjectFiles');
      
      cy.get('[title="Descargar"]').first().click();
      
      cy.wait('@downloadFile');
    });
  });
});