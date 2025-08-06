context('Report completed', () => {
  it('Basic Details not populated', () => {
    cy.visit('/report-completed/00000000-0000-0000-0000-600000000007')
    cy.get('#reviewReport').should('exist')
    cy.get('#close-window').should('exist')
  })
})
