context('Review Alert data checks', () => {
  it('Basic Details no review', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Information no review', () => {
    cy.visit('/information/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Treatment no review', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Recipients no review', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Sign and send no review', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Check your answers no review', () => {
    cy.visit('/check-your-answers/00000000-0000-0000-0000-600000000001')
    cy.get('#reviewAlert').should('not.exist')
  })

  it('Basic Details merge review', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Information merge review', () => {
    cy.visit('/information/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Treatment merge review', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Recipients merge review', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Sign and send merge review', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Check your answers merge review', () => {
    cy.visit('/check-your-answers/00000000-0000-0000-0000-600000000010')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Merge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Basic Details unmerge review', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Information unmerge review', () => {
    cy.visit('/information/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Treatment unmerge review', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Recipients unmerge review', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Sign and send unmerge review', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Check your answers unmerge review', () => {
    cy.visit('/check-your-answers/00000000-0000-0000-0000-600000000011')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'An Unmerge occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Basic Details move review', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Information move review', () => {
    cy.visit('/information/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Treatment move review', () => {
    cy.visit('/treatment/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Recipients move review', () => {
    cy.visit('/recipients/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Sign and send move review', () => {
    cy.visit('/sign-and-send/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })

  it('Check your answers move review', () => {
    cy.visit('/check-your-answers/00000000-0000-0000-0000-600000000012')
    cy.get('#reviewAlert').should('exist')
    cy.get('#reviewAlert').should(
      'contain.text',
      'A Move Event occurred on 1/1/1980 in NDelius and important details have changed. This report should be reviewed before proceeding. Please confirm all information or discard this report.',
    )
  })
})
