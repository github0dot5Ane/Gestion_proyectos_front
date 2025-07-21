describe('Página Mis Tareas Asignadas', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/tasks?assignedTo=me', {
      statusCode: 200,
      body: [],
    }).as('getMyTasks')
  })

  it('muestra encabezados y mensaje de "No hay tareas"', () => {
    cy.visit('/mis-tareas')

    cy.wait('@getMyTasks')

    cy.contains('h1', 'Mis Tareas Asignadas').should('exist')
    cy.contains('Lista de todas las tareas asignadas a ti').should('exist')

    cy.contains('No hay tareas asignadas').should('exist')
    cy.contains('No se encontraron tareas').should('exist')
  })
})
