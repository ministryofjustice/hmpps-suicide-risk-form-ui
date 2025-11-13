context('Form deleted Page', () => {
  const suicideRiskId = '00000000-0000-0000-0000-800000000000'

  it('renders the form deleted screen correctly', () => {
    cy.visit(`/form-deleted/${suicideRiskId}`)
    cy.contains('Document Deleted').should('exist')
    cy.contains('This form has been permanently deleted and cannot be recovered').should('exist')
  })
})
