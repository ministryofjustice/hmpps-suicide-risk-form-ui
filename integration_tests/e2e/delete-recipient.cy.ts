context('Delete Recipient Page', () => {
  const suicideRiskId = '00000000-0000-0000-0000-700000000000'
  const recipientId = '00000000-0000-0000-0000-700000000001'

  it('renders the delete confirmation screen correctly', () => {
    cy.visit(`/delete-recipient/${suicideRiskId}/${recipientId}`)
    cy.contains('Are you sure you wish to delete this Recipient?').should('exist')
    cy.get('#confirm-button').should('exist').and('contain.text', 'Confirm')
    cy.get('#cancel-button').should('exist').and('contain.text', 'Cancel')
  })

  it('cancel button redirects back to recipients list without performing a delete', () => {
    cy.visit(`/delete-recipient/${suicideRiskId}/${recipientId}`)
    cy.get('#cancel-button').click()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })

  it('confirm button redirects back to recipients list', () => {
    cy.visit(`/delete-recipient/${suicideRiskId}/${recipientId}`)
    cy.get('#confirm-button').click()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })
})
