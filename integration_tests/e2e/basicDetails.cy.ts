context('Basic Details page', () => {
  it('can default readonly fields', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#crn').should('contain.text', 'X000001')
  })

  it('displays a working basic details nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-basic-details').should('exist')
    cy.get('#nav-basic-details').click()
    cy.url().should('include', '/basic-details/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Basic Details').should('exist')
  })

  it('displays a working information nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-information').should('exist')
    cy.get('#nav-information').click()
    cy.url().should('include', '/information/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Information').should('exist')
  })

  it('displays a working treatment nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-treatment').should('exist')
    cy.get('#nav-treatment').click()
    cy.url().should('include', '/treatment/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Treatment').should('exist')
  })

  it('displays a working recipients nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-recipients').should('exist')
    cy.get('#nav-recipients').click()
    cy.url().should('include', '/recipients/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Recipients').should('exist')
  })

  it('displays a working sign-and-send nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-sign-and-send').should('exist')
    cy.get('#nav-sign-and-send').click()
    cy.url().should('include', '/sign-and-send/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Sign and Send').should('exist')
  })

  it('displays a working check your answers nav menu option', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-check-your-answers').should('exist')
    cy.get('#nav-check-your-answers').click()
    cy.url().should('include', '/check-your-answers/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Check Your Answers').should('exist')
  })

  it('navigates to report completed page if completed date set', () => {
    cy.visit('/basic-details/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })
})
