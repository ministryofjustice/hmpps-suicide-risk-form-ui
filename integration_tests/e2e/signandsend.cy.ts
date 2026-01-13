context('Sign and Send Page', () => {
  const wiremock = 'http://localhost:9091/__admin'
  afterEach(() => {
    cy.request('POST', `${wiremock}/reset`)
  })

  it('navigates to report completed page if completed date set', () => {
    cy.visit('/sign-and-send/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })

  it('Sign and Send with no signature', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('#sign-button').should('exist')
    cy.get('#clear-signature-button').should('not.exist')
  })

  it('shows only alternate address dropdown when no default address exists', () => {
    cy.request('DELETE', `${wiremock}/mappings/11111111-1111-1111-1111-111111111111`)

    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000013')

    cy.get('#alternate-address-text')
      .should('exist')
      .and('contain.text', 'Please specify the Work Location and Address that the Person on Probation should contact.')
    cy.get('#alternate-address-dropdown').should('exist')
    cy.get('#alternate-address').should('exist')

    cy.get('#workAddress').should('not.exist')
    cy.get('#update-address-button').should('not.exist')
    cy.get('#add-address-button').should('not.exist')
    cy.get('input[type="radio"][name="offenderAddressSelectOne"]').should('not.exist')
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
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000009')
    cy.get('#workAddress').should('contain.text', 'The Bessies Factory')
  })
})
