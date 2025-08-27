context('Sign and Send Page', () => {
  it('navigates to report completed page if completed date set', () => {
    cy.visit('/sign-and-send/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })

  it('Sign and Send with no signature', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('#sign-button').should('exist')
    cy.get('#clear-signature-button').should('not.exist')
  })

  it('Sign and Send default Address', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('#workAddress').should('contain.text', 'The Findus Factory')
  })

  it('Continue saves and navigates away', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.url().should('include', '/check-your-answers/00000000-0000-0000-0000-600000000005')
  })

  it('Refresh from delius reloads', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('#refresh-from-ndelius--button').should('exist')
    cy.get('#refresh-from-ndelius--button').click()
    cy.url().should('include', '/sign-and-send/00000000-0000-0000-0000-600000000005')
  })

  it('Sign and Send with signature', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000006')
    cy.get('#sign-button').should('not.exist')
    cy.get('#clear-signature-button').should('exist')
  })

  it('Sign and Send saved Address', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000006')
    cy.get('#workAddress').should('contain.text', 'The Birdseye Factory')
  })

  it('Sign and Send with manual address', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000009')
    cy.get('#update-address-button').should('exist')
    cy.get('#update-address-button').click()
    cy.url().should('include', '/update-work-address/00000000-0000-0000-0000-600000000009')
  })
})
