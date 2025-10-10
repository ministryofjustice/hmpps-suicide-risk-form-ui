context('Recipients Page', () => {
  it('navigates to report completed page if completed date set', () => {
    cy.visit('/recipients/30000000-0000-0000-0000-33333333333')
    cy.url().should('include', '/report-completed/30000000-0000-0000-0000-3333333333')
  })

  it('Verify screen content with no pre-existing recipients', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-000000000001')

    cy.contains('Suicide Risk - Recipients').should('exist')
    cy.contains('Other colleagues').should('exist')
    cy.contains('Prison Establishment').should('exist')
    cy.contains('Police (Custody Cells)').should('exist')
    cy.contains('Medical Services').should('exist')
    cy.contains('Other Agency').should('exist')

    cy.get('#add-other-colleagues--button').should('contain.text', 'Add Recipient of this type')
    cy.get('#add-prison-establishment--button').should('contain.text', 'Add Recipient of this type')
    cy.get('#add-police-custody--button').should('contain.text', 'Add Recipient of this type')
    cy.get('#add-medical-services--button').should('contain.text', 'Add Recipient of this type')
    cy.get('#add-other-agencies--button').should('contain.text', 'Add Recipient of this type')

    cy.get('p').should('contain.text', 'No Recipients of this type added')
    cy.get('p:contains("No Recipients of this type added")').should('have.length', 5)
  })

  it('Verify screen content with existing data', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-700000000000')

    cy.contains('No Recipients of this type added').should('not.exist')

    cy.contains('Other colleagues').should('exist')
    cy.contains('Prison Establishment').should('exist')
    cy.contains('Police (Custody Cells)').should('exist')
    cy.contains('Medical Services').should('exist')
    cy.contains('Other Agency').should('exist')

    cy.get('.govuk-summary-list').each($list => {
      cy.wrap($list).within(() => {
        cy.contains('Name').should('exist')
        cy.contains('Email').should('exist')
        cy.contains('Location').should('exist')
        cy.contains('Will be sent manually?').should('exist')
        cy.contains('Will be sent by email by this service?').should('exist')
      })
    })

    cy.contains('Click this link to edit the recipient').should('exist')
    cy.contains('Click this link to delete the recipient').should('exist')

    cy.contains('Other Agency')
      .parent()
      .within(() => {
        cy.contains('Jason Smith').should('exist')
        cy.contains('Jason Smith Junior').should('exist')
        cy.contains('Yes').should('exist')
        cy.contains('No').should('exist')
      })
  })

  it('add recipient buttons work correctly for all sections', () => {
    const suicideRiskId = '00000000-0000-0000-0000-000000000001'

    cy.visit(`/recipients/${suicideRiskId}`)

    const buttons = [
      { id: '#add-other-colleagues--button', type: 'COLLEAGUE' },
      { id: '#add-prison-establishment--button', type: 'PRISON' },
      { id: '#add-police-custody--button', type: 'POLICE' },
      { id: '#add-medical-services--button', type: 'MEDICAL' },
      { id: '#add-other-agencies--button', type: 'OTHER' },
    ]

    buttons.forEach(({ id, type }) => {
      cy.get(id).click()
      cy.url().should('include', `/recipient-details/${suicideRiskId}?contactType=${type}`)
      cy.go('back')
    })
  })

  it('Check edit recipient links function correctly', () => {
    const suicideRiskId = '00000000-0000-0000-0000-700000000000'
    cy.visit(`/recipients/${suicideRiskId}`)
    cy.contains('Click this link to edit the recipient').should('exist')
    cy.contains('Click this link to edit the recipient')
      .first()
      .then($link => {
        const href = $link.attr('href')
        expect(href).to.include(`/recipient-details/${suicideRiskId}?recipientId=`)
        cy.visit(href)
        cy.contains('Recipient Details –').should('be.visible')
      })
  })

  it('Check delete recipient links function correctly', () => {
    const suicideRiskId = '00000000-0000-0000-0000-700000000000'
    cy.visit(`/recipients/${suicideRiskId}`)
    cy.contains('Click this link to delete the recipient').should('exist')
    cy.contains('Click this link to delete the recipient')
      .first()
      .then($link => {
        const href = $link.attr('href')
        expect(href).to.include(`/delete-recipient/${suicideRiskId}/`)
        cy.visit(href)
        cy.contains('Are you sure you wish to delete this Recipient?').should('be.visible')
      })
  })
  it('Check all add recipients buttons function correctly', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-000000000001')

    cy.get('#add-other-colleagues--button')
      .should('have.attr', 'href')
      .and('include', '/recipient-details/00000000-0000-0000-0000-000000000001?contactType=COLLEAGUE')
    cy.get('#add-prison-establishment--button').should('have.attr', 'href').and('include', 'contactType=PRISON')
    cy.get('#add-police-custody--button').should('have.attr', 'href').and('include', 'contactType=POLICE')
    cy.get('#add-medical-services--button').should('have.attr', 'href').and('include', 'contactType=MEDICAL')
    cy.get('#add-other-agencies--button').should('have.attr', 'href').and('include', 'contactType=OTHER')
  })

  it('continue button performs a post and redirects to check-your-answers', () => {
    cy.intercept('POST', '/recipients/**').as('recipientsSubmit')
    cy.visit('/recipients/00000000-0000-0000-0000-000000000001')

    cy.get('#continue-button').click()
    cy.wait('@recipientsSubmit')
    cy.url().should('include', '/sign-and-send/00000000-0000-0000-0000-000000000001')
    cy.contains('Suicide Risk - Sign and Send').should('exist')
  })

  it('save and close button posts correct action', () => {
    cy.intercept('POST', '/recipients/**').as('saveAndCloseRequest')
    cy.visit('/recipients/00000000-0000-0000-0000-000000000001')

    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
  })

  it('refresh from Delius button reloads the page', () => {
    cy.intercept('POST', '/recipients/**').as('refreshFromNdelius')
    cy.visit('/recipients/00000000-0000-0000-0000-000000000001')

    cy.get('#refresh-from-ndelius--button').click()
    cy.wait('@refreshFromNdelius').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('refreshFromNdelius')
    })
    cy.url().should('include', '/recipients/00000000-0000-0000-0000-000000000001')
  })

  it('displays working navigation menu options', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-300000000003')

    cy.get('#nav-basic-details').click()
    cy.url().should('include', '/basic-details/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Basic Details').should('exist')

    cy.get('#nav-information').click()
    cy.url().should('include', '/information/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Information').should('exist')

    cy.get('#nav-treatment').click()
    cy.url().should('include', '/treatment/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Treatment').should('exist')

    cy.get('#nav-recipients-disabled').should('exist').and('have.class', 'disabled-nav')

    cy.get('#nav-check-your-answers').click()
    cy.url().should('include', '/check-your-answers/00000000-0000-0000-0000-300000000003')
    cy.contains('Suicide Risk - Check Your Answers').should('exist')
  })
})
