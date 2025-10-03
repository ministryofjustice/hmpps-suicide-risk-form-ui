context('Recipient Details Page', () => {
  const suicideRiskId = '00000000-0000-0000-0000-700000000000'

  const addCases = [
    { contactType: 'COLLEAGUE', label: 'Other Colleagues' },
    { contactType: 'PRISON', label: 'Prison Establishment' },
    { contactType: 'POLICE', label: 'Police Custody (Cells)' },
    { contactType: 'MEDICAL', label: 'Medical Services' },
    { contactType: 'OTHER', label: 'Other Agencies' },
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

      cy.get('#confirm-button').should('contain.text', 'Save')
      cy.get('#cancel-button').should('contain.text', 'Cancel without saving')
    })
  })

  const editCases = [
    { recipientId: '00000000-0000-0000-0000-700000000001', label: 'Other Colleagues', expectedName: 'John Smith' },
    { recipientId: '00000000-0000-0000-0000-700000000002', label: 'Prison Establishment', expectedName: 'Jack Smith' },
    {
      recipientId: '00000000-0000-0000-0000-700000000003',
      label: 'Police Custody (Cells)',
      expectedName: 'James Smith',
    },
    { recipientId: '00000000-0000-0000-0000-700000000004', label: 'Medical Services', expectedName: 'Jimmy Smith' },
    { recipientId: '00000000-0000-0000-0000-700000000005', label: 'Other Agencies', expectedName: 'Jason Smith' },
    {
      recipientId: '00000000-0000-0000-0000-700000000006',
      label: 'Other Agencies (2nd record)',
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

  function clickConfirmButton() {
    cy.get('#confirm-button').click()
  }

  it('validates required Name field', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#name').clear()
    clickConfirmButton()
    cy.contains('Name: This is a required value, please enter a value').should('be.visible')
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

  it('Cancel button navigates back to recipients list', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#cancel-button').click()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })

  it('Confirm button redirects correctly on successful submit', () => {
    cy.visit(`/recipient-details/${suicideRiskId}?contactType=COLLEAGUE`)
    cy.get('#name').clear()
    cy.get('#name').type('New Person')
    cy.get('#streetName').clear()
    cy.get('#streetName').type('New Street')
    cy.get('#townCity').clear()
    cy.get('#townCity').type('New Town')
    cy.get('#postcode').clear()
    cy.get('#postcode').type('ZZ1 1ZZ')
    cy.get('#description').clear()
    cy.get('#description').type('Office X')
    clickConfirmButton()
    cy.url().should('include', `/recipients/${suicideRiskId}`)
  })
})
