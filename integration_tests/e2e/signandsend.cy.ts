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

  it('Can See and Select who is sending fields', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000046')
    cy.get('#whoIsSendingTheForm').should('exist')
    cy.get('input[type="radio"][value="RO"]').should('exist')
    cy.get('input[type="radio"][value="USER"]').should('exist')
    cy.get('input[type="radio"][value="RO"]').check()
    cy.get('input[type="radio"][value="RO"]').should('be.checked')
  })

  it('Can See and Select new officer email field', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600007777777')
    cy.get('#officer-email-address_input').should('exist')
  })

  it('shows only alternate address dropdown when no default address exists', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000013')
    cy.get('input[type="radio"][value="RO"]').check()
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
    cy.get('input[type="radio"][value="RO"]').check()
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

  it('Should show hyperlinks for all required fields from the sign and send screen', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000005')
    cy.get('input[type="radio"][value="RO"]').check()
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.url().should('include', '/check-your-answers/00000000-0000-0000-0000-600000000005')
  })

  it('Should show email text box and telephone number text box', () => {
    cy.visit('/sign-and-send/7777777-4444-0000-0000-600000000999')
    cy.get('#officer-email-address_input').should('exist')
  })

  it('enter more than 200 characters in the email field gives an error', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#alternate-address').select('3')
    cy.get('#officer-email-address_input').type(
      'qnhcdkovyjawnwrndpcxdiupvdszdzsnmgtyrzvwkbwwyhksvjbwfsrlxdvmmxxdmltzymadkssmtcflyfmcbvxklwxuvkveagysszlkylfqbplhncpsgsnnybcuuqfkwigjyoawzdlvhnhkjenmmicsbqjbyglaeaqqukqrniliodjkdajouynetmsavjipczdvrkcd@police.uk',
    )
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.url().should('include', '/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#officer-email-address_input-error')
      .should('exist')
      .should(
        'contain.text',
        'Please enter a value that is less than or equal to 200 characters for Officer Email Address.',
      )
  })

  it('enter more than 35 characters in the telephone number field click continue gives an error', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#alternate-address').select('3')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.url().should('include', '/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  it('enter more than 35 characters in the telephone number field click Save and close gives an error', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#alternate-address').select('3')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#close-button').should('exist')
    cy.get('#close-button').click()
    cy.url().should('include', '/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  // sign
  it('enter more than 35 characters in the telephone number field click signature button gives an error', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#alternate-address').select('3')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#sign-button').should('exist')
    cy.get('#sign-button').click()
    cy.url().should('include', '/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  // need clear signature
  it('enter more than 35 characters in the telephone number field click clear signature button gives an error', () => {
    cy.visit('/sign-and-send/5f777f49-c833-438b-9fee-5daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#alternate-address').select('3')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#clear-signature-button').should('exist')
    cy.get('#clear-signature-button').click()
    cy.url().should('include', '/sign-and-send/5f777f49-c833-438b-9fee-5daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  it('enter more than 35 characters in the telephone number field and not selecting an alternate address click continue gives a standard error', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.url().should('include', '/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  // add address
  it('enter more than 35 characters in the telephone number field and not selecting an alternate address click add address gives a standard error', () => {
    cy.visit('/sign-and-send/89745555-c833-438b-9fee-4daf89745555')
    cy.get('#officer-email-address_input').should('exist')
    cy.get('#telephoneNumber_input').should('exist')
    cy.get('#telephoneNumber_input').type('0191vvrpxoquqjybbvirotkrrtthqxqnlxgdgbbrum')
    cy.get('#add-address-button').should('exist')
    cy.get('#add-address-button').click()
    cy.url().should('include', '/sign-and-send/89745555-c833-438b-9fee-4daf89745555')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#telephoneNumber_input-error')
      .should('exist')
      .should('contain.text', 'Please enter a value that is less than or equal to 35 characters for Telephone Number.')
  })

  it('rejects an email which is only the domain', () => {
    cy.visit('/sign-and-send/4f777f49-c833-438b-9fee-4daf3e17b094')
    cy.get('#officer-email-address_input').clear()
    cy.get('#officer-email-address_input').type('@police.uk')
    cy.get('#alternate-address').select('3')
    cy.get('#continue-button').should('exist')
    cy.get('#continue-button').click()
    cy.contains('Enter an email address in the correct format for Officer Email Address.').should('be.visible')
  })
})
