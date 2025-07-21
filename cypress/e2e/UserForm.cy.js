/// <reference types="cypress" />

describe('UserForm Component', () => {
  const mockUser = {
    id: 1,
    nombre: 'Usuario Existente',
    email: 'existente@test.com',
    telefono: '123456789',
    estado: true,
    admin: false
  };

  const mockOnSubmit = cy.stub().as('onSubmit');
  const mockOnCancel = cy.stub().as('onCancel');

  beforeEach(() => {
    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({
          users: {
            status: 'idle',
            error: null
          }
        }),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de las acciones
    cy.stub('../../features/users/userSlice', 'clearUserError').returns({ type: 'users/clearError' });
  });

  context('Formulario para nuevo usuario', () => {
    beforeEach(() => {
      cy.mount(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    });

    it('debe renderizar el formulario para nuevo usuario', () => {
      cy.contains('Crear Usuario').should('exist');
      cy.get('input[name="nombre"]').should('exist');
      cy.get('input[name="email"]').should('exist');
      cy.get('input[name="password"]').should('exist');
      cy.get('input[name="estado"]').should('be.checked');
      cy.get('input[name="admin"]').should('not.be.checked');
    });

    it('debe validar campos requeridos', () => {
      cy.get('input[name="nombre"]').clear();
      cy.get('input[name="email"]').clear();
      cy.get('input[name="password"]').clear();
      cy.contains('button', 'Crear Usuario').click();
      
      cy.contains('Nombre y Email son requeridos.').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });

    it('debe validar longitud mínima de contraseña', () => {
      cy.get('input[name="nombre"]').type('Nuevo Usuario');
      cy.get('input[name="email"]').type('nuevo@test.com');
      cy.get('input[name="password"]').type('12345');
      cy.contains('button', 'Crear Usuario').click();
      
      cy.contains('La contraseña debe tener al menos 8 caracteres').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });

    it('debe enviar el formulario con datos válidos', () => {
      const testData = {
        nombre: 'Nuevo Usuario',
        email: 'nuevo@test.com',
        telefono: '987654321',
        password: 'password123',
        estado: true,
        admin: true
      };

      cy.get('input[name="nombre"]').type(testData.nombre);
      cy.get('input[name="email"]').type(testData.email);
      cy.get('input[name="telefono"]').type(testData.telefono);
      cy.get('input[name="password"]').type(testData.password);
      cy.get('input[name="admin"]').check();
      cy.contains('button', 'Crear Usuario').click();

      cy.get('@onSubmit').should('have.been.calledWith', testData);
    });

    it('debe llamar a onCancel al hacer clic en Cancelar', () => {
      cy.contains('button', 'Cancelar').click();
      cy.get('@onCancel').should('have.been.calledOnce');
    });
  });

  context('Formulario para editar usuario', () => {
    beforeEach(() => {
      cy.mount(<UserForm user={mockUser} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    });

    it('debe renderizar el formulario para editar usuario', () => {
      cy.contains('Guardar Cambios').should('exist');
      cy.get('input[name="nombre"]').should('have.value', mockUser.nombre);
      cy.get('input[name="email"]').should('have.value', mockUser.email);
      cy.get('input[name="telefono"]').should('have.value', mockUser.telefono);
      cy.get('input[name="estado"]').should('be.checked');
      cy.get('input[name="admin"]').should('not.be.checked');
      cy.get('input[name="password"]').should('not.exist');
    });

    it('debe enviar los cambios sin contraseña', () => {
      const updatedData = {
        nombre: 'Usuario Modificado',
        email: 'modificado@test.com',
        telefono: '555555555',
        estado: false,
        admin: true
      };

      cy.get('input[name="nombre"]').clear().type(updatedData.nombre);
      cy.get('input[name="email"]').clear().type(updatedData.email);
      cy.get('input[name="telefono"]').clear().type(updatedData.telefono);
      cy.get('input[name="estado"]').uncheck();
      cy.get('input[name="admin"]').check();
      cy.contains('button', 'Guardar Cambios').click();

      cy.get('@onSubmit').should('have.been.calledWith', updatedData, mockUser.id);
    });

    it('debe validar campos requeridos en edición', () => {
      cy.get('input[name="nombre"]').clear();
      cy.get('input[name="email"]').clear();
      cy.contains('button', 'Guardar Cambios').click();
      
      cy.contains('Nombre y Email son requeridos.').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });
  });

  context('Estados de carga y error', () => {
    it('debe mostrar spinner durante el envío', () => {
      // Sobrescribir el mock para simular carga
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            users: {
              status: 'loading',
              error: null
            }
          })
        };
      });

      cy.mount(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      cy.get('.animate-spin').should('exist');
      cy.contains('button', 'Crear Usuario').should('be.disabled');
    });

    it('debe mostrar mensaje de error si existe', () => {
      const errorMessage = 'Error al guardar usuario';
      
      // Sobrescribir el mock para simular error
      cy.window().then((win) => {
        win.reduxStore = {
          ...win.reduxStore,
          getState: () => ({
            ...win.reduxStore.getState(),
            users: {
              status: 'failed',
              error: errorMessage
            }
          })
        };
      });

      cy.mount(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      cy.contains('Error: ' + errorMessage).should('exist');
    });
  });

  context('Validación de campos', () => {
    it('debe validar formato de email', () => {
      cy.mount(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      cy.get('input[name="email"]').type('email-invalido');
      cy.contains('button', 'Crear Usuario').click();
      
      cy.contains('Email no válido').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });

    it('debe validar formato de teléfono', () => {
      cy.mount(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      cy.get('input[name="telefono"]').type('abc123');
      cy.contains('button', 'Crear Usuario').click();
      
      cy.contains('Teléfono solo puede contener números').should('exist');
      cy.get('@onSubmit').should('not.have.been.called');
    });
  });
});