context('Confirm delete Page', () => {
  const suicideRiskId = '00000000-0000-0000-0000-800000000000'

  it('renders the delete confirmation screen correctly', () => {
    cy.visit(`/confirm-delete/${suicideRiskId}`)
    cy.contains('Are you sure you wish to delete this document?').should('exist')
    cy.get('#confirm-button').should('exist').and('contain.text', 'Confirm')
    cy.get('#cancel-button').should('exist').and('contain.text', 'Cancel')
  })

  it('cancel button redirects back to check your answers page without performing a delete', () => {
    cy.visit(`/confirm-delete/${suicideRiskId}`)
    cy.get('#cancel-button').click()
    cy.url().should('include', `/check-your-answers/${suicideRiskId}`)
  })

  it('confirm button redirects back to recipients list', () => {
    cy.visit(`/confirm-delete/${suicideRiskId}`)
    cy.get('#confirm-button').click()
    cy.url().should('include', `/form-deleted/${suicideRiskId}`)
  })
})
