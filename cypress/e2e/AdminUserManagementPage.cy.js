describe('Gestión de Usuarios - Admin', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/users', {
      statusCode: 200,
      body: [],
    }).as('getUsers');

    cy.visit('/admin/usuarios');

    cy.wait('@getUsers'); // Espera la solicitud interceptada
  });

  it('muestra encabezado y mensaje de "No hay usuarios"', () => {
    cy.contains('h1', 'Gestión de Usuarios').should('exist');
    cy.contains('No hay usuarios').should('exist');
  });
});
