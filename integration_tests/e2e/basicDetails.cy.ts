context('Basic Details page', () => {
  it('can see readonly fields', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#page-title').should('contain.text', 'Suicide Risk - Basic Details')
    cy.get('#name').should('contain.text', 'Mr Billy The Kid')
    cy.get('#crn').should('contain.text', 'X000001')
    cy.get('#no-fixed-abode').should('contain.text', 'No Fixed Abode')
    cy.get('#date-of-birth').should('contain.text', '17/03/1980')
    cy.get('#calculated-age').should('contain.text', '45')
    cy.get('#prison-number').should('contain.text', '1234567')
  })

  it('can see buttons', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').should('contain.text', 'Continue')
    cy.get('#close-button').should('contain.text', 'Save Progress and Close')
    cy.get('#refresh-from-ndelius--button').should('contain.text', 'Refresh from Delius')
  })

  it('refresh button performs a post request then reloads the screen', () => {
    cy.intercept('POST', '/basic-details/**').as('refreshRequest')
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#name').should('contain.text', 'Mr Billy The Kid')
    cy.get('#refresh-from-ndelius--button').click()
    cy.wait('@refreshRequest')
    cy.url().should('include', '/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#name').should('contain.text', 'Mr Billy The Kid')
    cy.get('#crn').should('contain.text', 'X000001')
    cy.get('#date-of-birth').should('contain.text', '17/03/1980')
    cy.get('#calculated-age').should('contain.text', '45')
    cy.get('#prison-number').should('contain.text', '1234567')
  })

  it('close button performs a post request and displays message', () => {
    cy.intercept('POST', '/basic-details/**').as('saveAndCloseRequest')
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
    cy.get('#page-title').should('not.exist')
  })

  it('continue button performs a post and redirects to information page', () => {
    cy.intercept('POST', '/basic-details/**').as('formSubmit')
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/information/00000000-0000-0000-0000-000000000001')
    cy.contains('Suicide Risk - Information')
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

  it('should return to check your answers if came from check your answers', () => {
    cy.visit('/basic-details/2923f8ed-d425-43da-97c3-54ddab9dff7e?returnTo=check-your-report')
    cy.url().should('include', '/basic-details')
    cy.get('#continue-button').click()
    cy.url().should('include', '/check-your-answers/')
  })
})
