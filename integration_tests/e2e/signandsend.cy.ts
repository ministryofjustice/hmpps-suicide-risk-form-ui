context('Sign and Send Page', () => {
  it('navigates to report completed page if completed date set', () => {
    cy.visit('/sign-and-send/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })
})
