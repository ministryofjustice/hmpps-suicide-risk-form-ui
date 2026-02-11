context('Recipient Details Page', () => {
  const suicideRiskId = '00000000-0000-0000-0000-700000000000'

  const addCases = [
    { contactType: 'COLLEAGUE', label: 'Other colleagues' },
    { contactType: 'PRISON', label: 'Prison Establishment' },
    { contactType: 'POLICE', label: 'Police (Custody Cells)' },
    { contactType: 'MEDICAL', label: 'Medical Services' },
    { contactType: 'OTHER', label: 'Other Agency' },
  ]

  addCases.forEach(({ contactType, label }) => {
    it(`renders Recipient Details form correctly for ${label}`, () => {
      cy.visit(`/recipient-details/${suicideRiskId}?contactType=${contactType}`)

      cy.contains(`Recipient Details – ${label}`).should('exist')

      cy.get('#name').should('exist')
      cy.get('#description').should('exist')
      cy.get('#buildingName').should('exist')
      cy.get('#houseNumber').should('exist')
      cy.get('#streetName').should('exist')
      cy.get('#district').should('exist')
      cy.get('#townCity').should('exist')
      cy.get('#county').should('exist')
      cy.get('#postcode').should('exist')
      cy.get('#email').should('exist')
      cy.contains('Are you going to send this form to this recipient manually?').should('exist')
      cy.contains('Do you want the system to email the completed form to this recipient?').should('exist')

      cy.get('#confirm-button').should('contain.text', 'Save')
      cy.get('#cancel-button').should('contain.text', 'Cancel without saving')
    })
  })

  const editCases = [
    { recipientId: '00000000-0000-0000-0000-700000000001', label: 'Other colleagues', expectedName: 'John Smith' },
    { recipientId: '00000000-0000-0000-0000-700000000002', label: 'Prison Establishment', expectedName: 'Jack Smith' },
    {
      recipientId: '00000000-0000-0000-0000-700000000003',
      label: 'Police (Custody Cells)',
      expectedName: 'James Smith',
    },
    { recipientId: '00000000-0000-0000-0000-700000000004', label: 'Medical Services', expectedName: 'Jimmy Smith' },
    { recipientId: '00000000-0000-0000-0000-700000000005', label: 'Other Agency', expectedName: 'Jason Smith' },
    {
      recipientId: '00000000-0000-0000-0000-700000000006',
      label: 'Other Agency (2nd record)',
      expectedName: 'Jason Smith Junior',
    },
  ]

  editCases.forEach(({ recipientId, label, expectedName }) => {
    it(`renders Recipient Details form correctly for ${label}`, () => {
      cy.visit(`/recipient-details/${suicideRiskId}?recipientId=${recipientId}`)

      cy.contains('Recipient Details –').should('exist')
      cy.get('#name').should('have.value', expectedName)
      cy.get('#description').should('have.value', 'Office')
      cy.get('#buildingName').should('have.value', 'Building')
      cy.get('#houseNumber').should('have.value', '7')
      cy.get('#streetName').should('have.value', 'Street')
      cy.get('#district').should('have.value', 'District')
      cy.get('#townCity').should('have.value', 'Town')
      cy.get('#county').should('have.value', 'County')
      cy.get('#postcode').should('have.value', 'AA1 1AA')
    })
  })

  it('renders Recipient Details form correctly (With Email + Radios set)', () => {
    const recipientId = '00000000-0000-0000-0000-700000000007'

    cy.visit(`/recipient-details/${suicideRiskId}?recipientId=${recipientId}`)

    cy.contains('Recipient Details –').should('exist')
    cy.get('#name').should('have.value', 'Janet Smith')
    cy.get('#description').should('have.value', 'Regional Office')
    cy.get('#buildingName').should('have.value', 'The Archway')
    cy.get('#houseNumber').should('have.value', '9')
    cy.get('#streetName').should('have.value', 'Main Street')
    cy.get('#district').should('have.value', 'North District')
    cy.get('#townCity').should('have.value', 'Riverside')
    cy.get('#county').should('have.value', 'Northshire')
    cy.get('#postcode').should('have.value', 'BB2 2BB')
    cy.get('#email').should('have.value', 'janet.smith@example.com')
    cy.get('input[name="sendFormManually"][value="true"]').should('be.checked')
    cy.get('input[name="sendFormViaEmail"][value="false"]').should('be.checked')
  })

  function clickConfirmButton() {
    cy.get('#confirm-button').click()
  }

  it('validates required Name field', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#name').clear()
    clickConfirmButton()
    cy.contains('Name: This is a required value, please enter a value').should('be.visible')
  })

  it('validates email is in the list of allowed email addresses and fails if not', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('input[name="sendFormViaEmail"][value="true"]').check()
    cy.get('#email').clear()
    cy.get('#email').type('testuser@polte.uk')
    clickConfirmButton()
    cy.contains(
      'Please enter an email address from the approved recipient list. Please contact IT for further information',
    ).should('be.visible')
  })

  it('validates email is in the list of allowed email addresses and succeeds if it is', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('input[name="sendFormViaEmail"][value="true"]').check()
    cy.get('input[name="sendFormManually"][value="false"]').check()
    cy.get('#name').type('Janet Smith')
    cy.get('#description').type('Regional Office')
    cy.get('#buildingName').type('The Archway')
    cy.get('#houseNumber').type('9')
    cy.get('#streetName').type('Main Street')
    cy.get('#district').type('North District')
    cy.get('#townCity').type('Riverside')
    cy.get('#county').type('Northshire')
    cy.get('#postcode').type('BB2 2BB')
    cy.get('#email').clear()
    cy.get('#email').type('testuser@police.uk')
    clickConfirmButton()
    cy.url().should('include', 'recipients/00000000-0000-0000-0000-700000000000')
  })

  it('validates identifier fields (at least one of Description, Building Name, Address Number)', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#description').clear()
    cy.get('#buildingName').clear()
    cy.get('#houseNumber').clear()
    clickConfirmButton()
    cy.contains('At least 1 out of [Description, Building Name, Address Number] must be present').should('be.visible')
  })

  it('validates Street Name required', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#streetName').clear()
    clickConfirmButton()
    cy.contains('Street Name : This is a required value, please enter a value').should('be.visible')
  })

  it('validates Town/City required', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#townCity').clear()
    clickConfirmButton()
    cy.contains('Town/City : This is a required value, please enter a value').should('be.visible')
  })

  it('validates Postcode required', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#postcode').clear()
    clickConfirmButton()
    cy.contains('Postcode : This is a required value, please enter a value').should('be.visible')
  })

  it('validates "Are you going to send this form to this recipient manually?" not selected', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    clickConfirmButton()
    cy.contains(
      'Please select an answer to the question Are you going to send this form to this recipient manually?',
    ).should('be.visible')
  })

  it('validates "Do you want the system to email the completed form to this recipient?" not selected', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    clickConfirmButton()
    cy.contains(
      'Please select an answer to the question Do you want the system to email the completed form to this recipient?',
    ).should('be.visible')
  })

  it('validates email required when "send form by email" is Yes and no email provided', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('input[name="sendFormViaEmail"][value="true"]').check()
    cy.get('#email').clear()
    clickConfirmButton()
    cy.contains(
      'You have indicated that you will be emailing the form to a recipient but have not entered the recipients email address',
    ).should('be.visible')
  })

  function fillValidForm() {
    cy.get('#name').invoke('val', 'Valid Name').trigger('input')
    cy.get('#description').invoke('val', 'Office').trigger('input')
    cy.get('#buildingName').invoke('val', 'Building').trigger('input')
    cy.get('#houseNumber').invoke('val', '1').trigger('input')
    cy.get('#streetName').invoke('val', 'Street').trigger('input')
    cy.get('#district').invoke('val', 'District').trigger('input')
    cy.get('#townCity').invoke('val', 'Town').trigger('input')
    cy.get('#county').invoke('val', 'County').trigger('input')
    cy.get('#postcode').invoke('val', 'AA1 1AA').trigger('input')
    cy.get('#email').invoke('val', 'valid@example.com').trigger('input')
    cy.get('input[name="sendFormViaEmail"][value="false"]').check({ force: true })
    cy.get('input[name="sendFormManually"][value="true"]').check({ force: true })
  }

  const lengthTests = [
    { selector: '#name', label: 'Name', max: 200 },
    { selector: '#description', label: 'Office Description', max: 50 },
    { selector: '#buildingName', label: 'Building Name', max: 35 },
    { selector: '#houseNumber', label: 'Address Number', max: 35 },
    { selector: '#streetName', label: 'Street Name', max: 35 },
    { selector: '#district', label: 'District', max: 35 },
    { selector: '#townCity', label: 'Town or City', max: 35 },
    { selector: '#county', label: 'County', max: 35 },
    { selector: '#postcode', label: 'Postcode', max: 8 },
    { selector: '#email', label: 'Email', max: 250 },
  ]

  lengthTests.forEach(({ selector, label, max }) => {
    it(`validates ${label} exceeds ${max} characters`, () => {
      cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
      fillValidForm()
      cy.get(selector)
        .invoke('val', 'X'.repeat(max + 1))
        .trigger('input')
      clickConfirmButton()
      cy.contains(`Please enter ${max} characters or less for ${label}`).should('be.visible')
    })
  })

  it('Cancel button navigates back to recipients list', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#cancel-button').click()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })

  it('Confirm button redirects correctly on successful submit', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#name').invoke('val', 'New Person').trigger('input')
    cy.get('#streetName').invoke('val', 'New Street').trigger('input')
    cy.get('#townCity').invoke('val', 'New Town').trigger('input')
    cy.get('#postcode').invoke('val', 'ZZ1 1ZZ').trigger('input')
    cy.get('#description').invoke('val', 'Office X').trigger('input')

    cy.get('input[name="sendFormManually"][value="true"]').check()
    cy.get('input[name="sendFormViaEmail"][value="false"]').check()
    clickConfirmButton()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })
})
