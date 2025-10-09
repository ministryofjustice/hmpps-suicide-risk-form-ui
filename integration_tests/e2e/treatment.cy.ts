context('Treatment Page', () => {
  it('navigates to report completed page if completed date set', () => {
    cy.visit('/treatment/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })

  it('can see buttons', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').should('contain.text', 'Continue')
    cy.get('#close-button').should('contain.text', 'Save Progress and Close')
    cy.get('#search-contacts--button').should('contain.text', 'Search Contacts')
  })

  it('can see fields and text', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#current-psych-treatment').should('exist')
    cy.get('#current-psych-treatment-hint').should('contain.text', 'Any Current Psychiatric Treatment')
    cy.get('#search-contacts-text').should(
      'contain.text',
      'To search for Contacts relating to "Psychiatric Treatment" press here',
    )
  })

  it('Current psychiatric treatment > 20000 characters triggers validation', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#current-psych-treatment').should('exist')
    cy.contains('Any current psychiatric treatment must be 20000 characters or less').should('not.exist')
    cy.contains('You have 1 character too many').should('not.exist')

    // Directly set the value rather than using type() which is slow.
    const longText = '1'.repeat(20001)
    cy.get('#current-psych-treatment').invoke('val', longText).trigger('input')

    cy.contains('You have 1 character too many').should('exist')
    cy.get('#continue-button').click()
    cy.contains('Any current psychiatric treatment must be 20000 characters or less').should('exist')
  })

  it('close button performs a post request and displays message', () => {
    cy.intercept('POST', '/treatment/**').as('saveAndCloseRequest')
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
    cy.get('#page-title').should('not.exist')
  })

  it('continue button performs a post and redirects to recipients page', () => {
    cy.intercept('POST', '/treatment/**').as('formSubmit')
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/recipients/00000000-0000-0000-0000-000000000001')
    cy.contains('Suicide Risk - Recipients').should('exist')
  })

  it('search contacts button displays content with results', () => {
    cy.intercept('POST', '/treatment/**').as('searchContacts')
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#search-contacts--button').click()
    cy.wait('@searchContacts').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('searchContacts')
    })
    cy.get('#search-contacts-text').should('not.exist')
    cy.get('#treatment-heading').should('contain.text', 'Contacts relating to Treatment')
    cy.get('#contacts-found').should('contain.text', '3 Contacts found')

    cy.get('#contact-notes-details-1').should('contain.text', 'Date:')
    cy.get('#contact-notes-details-1').should('contain.text', 'Description:')
    cy.get('#contact-notes-details-1').should('contain.text', 'Type:')
    cy.get('#contact-notes-details-1').should('contain.text', 'Outcome:')

    cy.get('#view-contact-notes--govuk-details-1').should('contain.text', 'View Contact notes')
    cy.contains('Test notes attended complied with psychiatric treatment').should('exist')

    cy.get('#show-documents-found--govuk-details-1').should('contain.text', 'Show associated documents')
    cy.contains('Document name: my document.pdf').should('exist')

    cy.get('#contact--deeplink-1').should(
      'contain.text',
      'select this hyperlink to open the ndelius contact page in a new tab',
    )
    cy.get('#contact--deeplink-1')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('match', /deeplink\.xhtml\?component=Contact&CRN=X000001&componentId=2500310461$/)
  })

  it('search contacts button displays content without results', () => {
    cy.intercept('POST', '/treatment/**').as('searchContacts')
    cy.visit('/treatment/00000000-0000-0000-0000-200000000002')
    cy.get('#search-contacts--button').click()
    cy.wait('@searchContacts').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('searchContacts')
    })
    cy.get('#treatment-heading').should('contain.text', 'Contacts relating to Treatment')
    cy.get('#contacts-found').should('contain.text', '0 Contacts found')
    cy.get('#no-contacts-found').should(
      'contain.text',
      'No contacts relating to Psychiatric Treatment have been found.',
    )

    cy.get('#contact-notes-details-1').should('not.exist')
    cy.get('#view-contact-notes--govuk-details-1').should('not.exist')
    cy.get('#show-documents-found--govuk-details-1').should('not.exist')
    cy.get('#contact--deeplink-1').should('not.exist')
  })

  it('updated Current Psychiatric Treatment input is persisted on post', () => {
    cy.intercept('POST', '/treatment/**').as('formSubmit')
    cy.visit('/treatment/00000000-0000-0000-0000-000000000001')
    cy.get('#current-psych-treatment').type('new notes here')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit').then(({ request }) => {
      const { body } = request
      const params = new URLSearchParams(body)
      const currentPsychTreatment = params.get('currentPsychTreatment')
      expect(currentPsychTreatment).to.equal('new notes here')
    })
  })

  it('displays a working basic details nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-basic-details').should('exist')
    cy.get('#nav-basic-details').click()
    cy.url().should('include', '/basic-details/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Basic Details').should('exist')
  })

  it('displays a working information nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-information').should('exist')
    cy.get('#nav-information').click()
    cy.url().should('include', '/information/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Information').should('exist')
  })

  it('displays a working treatment nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-treatment').should('exist')
    cy.get('#nav-treatment').click()
    cy.url().should('include', '/treatment/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Treatment').should('exist')
  })

  it('displays a disabled recipients nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-recipients-disabled').should('exist')
    cy.get('#nav-sign-and-send-disabled').should('have.class', 'disabled-nav')
  })

  it('displays a disabled sign-and-send nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-sign-and-send-disabled').should('exist')
    cy.get('#nav-sign-and-send-disabled').should('have.class', 'disabled-nav')
  })

  it('displays a working check your answers nav menu option', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-300000000003')
    cy.get('#nav-check-your-answers').should('exist')
    cy.get('#nav-check-your-answers').click()
    cy.url().should('include', '/check-your-answers/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Check Your Answers').should('exist')
  })
})
