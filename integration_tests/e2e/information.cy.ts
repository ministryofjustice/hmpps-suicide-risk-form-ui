context('information', () => {
  it('can see buttons', () => {
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').should('contain.text', 'Continue')
    cy.get('#close-button').should('contain.text', 'Save Progress and Close')
    cy.get('#refresh-from-ndelius--button').should('contain.text', 'Refresh from Delius')
  })

  it('can see readonly fields', () => {
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    // cy.get('#page-title').should('contain.text', 'Suicide Risk - Information')
    cy.get('#nature-of-risk').should('contain.text', 'The nature of the risk is X')
    cy.get('#risk-imminence').should('contain.text', 'the risk is imminent and more probably in X situation')
    cy.get('#risk-increase-factors').should('contain.text', 'If offender in situation X the risk can be higher')
    cy.get('#risk-decrease-factors').should('contain.text', 'Giving offender therapy in X will reduce the risk')
    cy.get('#registration-start-date').should('contain.text', '2025-01-01')
    cy.get('#registration-end-date').should('contain.text', '2025-01-01')
    cy.get('#registration-notes').should('contain.text', 'some notes in here')
  })

  it('refresh button performs a post request then reloads the information page', () => {
    cy.intercept('POST', '/information/**').as('refreshRequest')
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    cy.get('#nature-of-risk').should('contain.text', 'The nature of the risk is X')
    cy.get('#refresh-from-ndelius--button').click()
    cy.wait('@refreshRequest')
    cy.url().should('include', '/information/00000000-0000-0000-0000-000000000001')
    cy.get('#nature-of-risk').should('contain.text', 'The nature of the risk is X')
    cy.get('#risk-imminence').should('contain.text', 'the risk is imminent and more probably in X situation')
    cy.get('#risk-increase-factors').should('contain.text', 'If offender in situation X the risk can be higher')
    cy.get('#risk-decrease-factors').should('contain.text', 'Giving offender therapy in X will reduce the risk')
    cy.get('#registration-start-date').should('contain.text', '2025-01-01')
    cy.get('#registration-end-date').should('contain.text', '2025-01-01')
    cy.get('#registration-notes').should('contain.text', 'some notes in here')
  })

  it('close button performs a post request and displays message', () => {
    cy.intercept('POST', '/information/**').as('saveAndCloseRequest')
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
    cy.get('#page-title').should('not.exist')
  })

  it('continue button performs a post and redirects to treatment page', () => {
    cy.intercept('POST', '/information/**').as('formSubmit')
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/treatment/00000000-0000-0000-0000-000000000001')
    cy.contains('Suicide Risk - Treatment')
  })

  it('updated additional information input is persisted on post', () => {
    cy.intercept('POST', '/information/**').as('formSubmit')
    cy.visit('/information/00000000-0000-0000-0000-000000000001')
    cy.get('#additionalInfo').type('new notes here')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit').then(({ request }) => {
      const { body } = request
      const params = new URLSearchParams(body)
      const additionalInfo = params.get('additionalInfo')

      expect(additionalInfo).to.equal('new notes here')
    })
  })

  it('displays a working basic details nav menu option', () => {
    cy.visit('/information/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-basic-details').should('exist')
    cy.get('#nav-basic-details').click()
    cy.url().should('include', '/basic-details/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Basic Details').should('exist')
  })

  it('displays a working information nav menu option', () => {
    cy.visit('/information/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-information').should('exist')
    cy.get('#nav-information').click()
    cy.url().should('include', '/information/00000000-0000-0000-0000-200000000002')
    cy.contains('Suicide Risk - Information').should('exist')
  })

  it('displays a working treatment nav menu option', () => {
    cy.visit('/information/00000000-0000-0000-0000-200000000002')
    cy.get('#nav-treatment').should('exist')
    cy.pause()
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
