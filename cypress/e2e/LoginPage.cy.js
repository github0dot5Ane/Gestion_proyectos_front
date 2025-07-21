/// <reference types="cypress" />

describe('LoginPage', () => {
  beforeEach(() => {
    // Configuramos los mocks antes de cada test
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { success: true }
    }).as('loginRequest');

    // Mock de Redux store
    cy.window().then((win) => {
      win.reduxStore = {
        getState: () => ({}),
        subscribe: () => () => {},
        dispatch: cy.stub().as('dispatch')
      };
    });

    // Mock de navigate
    cy.stub(window, 'ReactRouterDom').callsFake(() => ({
      useNavigate: () => cy.stub().as('navigate'),
      useLocation: () => ({ state: {} }),
      // Mantener otras funcionalidades de react-router-dom
      ...window.ReactRouterDom
    }));

    cy.mount(
      <Provider store={window.reduxStore}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );
  });

  it('renderiza el formulario de login', () => {
    cy.get('label').contains('Correo electrónico').should('exist');
    cy.get('label').contains('Contraseña').should('exist');
    cy.get('button').contains('Iniciar sesión').should('exist');
  });

  it('permite escribir en los inputs', () => {
    const email = 'test@correo.com';
    const password = '123456';

    cy.get('input[name="email"]')
      .type(email)
      .should('have.value', email);
    
    cy.get('input[name="password"]')
      .type(password)
      .should('have.value', password);
  });

  it('envía el formulario al hacer submit', () => {
    const email = 'test@correo.com';
    const password = '123456';

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Verificamos que se llamó a dispatch
    cy.get('@dispatch').should('have.been.calledTwice'); // clearAuthError + loginUser
  });

  it('muestra errores de validación', () => {
    // Email inválido
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.contains('El correo electrónico no es válido').should('exist');
    cy.contains('La contraseña debe tener al menos 6 caracteres').should('exist');
  });
});