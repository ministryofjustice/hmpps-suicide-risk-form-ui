context('Update Work Address page', () => {
  it('page will load and show all required fields', () => {
    cy.visit('/update-work-address/00000000-0000-0000-0000-600000000009')
    cy.url().should('include', '/update-work-address')
    cy.get('#description').should('exist').should('be.visible')
    cy.get('#buildingName').should('exist').should('be.visible')
    cy.get('#houseNumber').should('exist').should('be.visible')
    cy.get('#streetName').should('exist').should('be.visible')
    cy.get('#district').should('exist').should('be.visible')
    cy.get('#townCity').should('exist').should('be.visible')
    cy.get('#county').should('exist').should('be.visible')
    cy.get('#postcode').should('exist').should('be.visible')
  })

  it('will save all fields and redirect properly when Save is clicked', () => {
    cy.visit('/update-work-address/00000000-0000-0000-0000-600000000009')
    cy.url().should('include', '/update-work-address')
    cy.get('#description').type('A Description')
    cy.get('#buildingName').type('B Building Name')
    cy.get('#houseNumber').type('C House Number')
    cy.get('#streetName').type('D Street Name')
    cy.get('#district').type('E District')
    cy.get('#townCity').type('F Town City')
    cy.get('#county').type('G County')
    cy.get('#postcode').type('H')
    cy.get('#save-button').should('exist').should('be.visible').click()
    cy.url().should('include', '/sign-and-send')
  })

  it('will return to sign and send screen when cancel is clicked', () => {
    cy.visit('/update-work-address/00000000-0000-0000-0000-600000000009')
    cy.url().should('include', '/update-work-address')
    cy.get('#cancel-button').should('exist').should('be.visible').click()
    cy.url().should('include', '/sign-and-send')
  })

  it('validation will trigger when none of description, number or name is present', () => {
    cy.visit('/update-work-address/00000000-0000-0000-0000-600000000005')
    cy.url().should('include', '/update-work-address')
    cy.get('#streetName').type('D Street Name')
    cy.get('#district').type('E District')
    cy.get('#townCity').type('F Town City')
    cy.get('#county').type('G County')
    cy.get('#postcode').type('H Postcode')
    cy.get('#save-button').should('exist').should('be.visible').click()
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#description-error')
      .should('exist')
      .should('contain.text', 'At least 1 out of [Description, Building Name, Address Number] must be present')
    cy.get('#buildingName-error')
      .should('exist')
      .should('contain.text', 'At least 1 out of [Description, Building Name, Address Number] must be present')
    cy.get('#houseNumber-error')
      .should('exist')
      .should('contain.text', 'At least 1 out of [Description, Building Name, Address Number] must be present')
  })

  it('validation will trigger when street, town or postcode is left blank', () => {
    cy.visit('/update-work-address/00000000-0000-0000-0000-600000000005')
    cy.url().should('include', '/update-work-address')
    cy.get('#description').type('A Description')
    cy.get('#buildingName').type('B Building Name')
    cy.get('#houseNumber').type('C House Number')
    cy.get('#district').type('E District')
    cy.get('#save-button').should('exist').should('be.visible').click()
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.get('#streetName-error')
      .should('exist')
      .should('contain.text', 'Street Name : This is a required value, please enter a value')
    cy.get('#townCity-error')
      .should('exist')
      .should('contain.text', 'Town/City : This is a required value, please enter a value')
    cy.get('#postcode-error')
      .should('exist')
      .should('contain.text', 'Postcode : This is a required value, please enter a value')
  })

  function fillValidForm() {
    cy.get('#description').invoke('val', 'Office').trigger('input')
    cy.get('#buildingName').invoke('val', 'Building').trigger('input')
    cy.get('#houseNumber').invoke('val', '1').trigger('input')
    cy.get('#streetName').invoke('val', 'Street').trigger('input')
    cy.get('#district').invoke('val', 'District').trigger('input')
    cy.get('#townCity').invoke('val', 'Town').trigger('input')
    cy.get('#county').invoke('val', 'County').trigger('input')
    cy.get('#postcode').invoke('val', 'AA1 1AA').trigger('input')
  }

  function clickSaveButton() {
    cy.get('#save-button').click()
  }

  const lengthTests = [
    { selector: '#description', label: 'Office Description', max: 50 },
    { selector: '#buildingName', label: 'Building Name', max: 35 },
    { selector: '#houseNumber', label: 'Address Number', max: 35 },
    { selector: '#streetName', label: 'Street Name', max: 35 },
    { selector: '#district', label: 'District', max: 35 },
    { selector: '#townCity', label: 'Town or City', max: 35 },
    { selector: '#county', label: 'County', max: 35 },
    { selector: '#postcode', label: 'Postcode', max: 8 },
  ]

  const suicideRiskId = '00000000-0000-0000-0000-600000000005'

  lengthTests.forEach(({ selector, label, max }) => {
    it(`validates ${label} exceeds ${max} characters`, () => {
      cy.visit(`/update-work-address/${suicideRiskId}`)
      fillValidForm()
      cy.get(selector)
        .invoke('val', 'X'.repeat(max + 1))
        .trigger('input')
      clickSaveButton()
      cy.contains(`Please enter ${max} characters or less for ${label}`).should('be.visible')
    })
  })
})
