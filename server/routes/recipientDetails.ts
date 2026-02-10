import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk, SuicideRiskAddress, SuicideRiskContact } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import NDeliusIntegrationApiClient, { EmailRecipientData } from '../data/ndeliusIntegrationApiClient'

export default function recipientsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'recipient-details'

  router.get('/recipient-details/:id', async (req, res) => {
    await auditService.logPageView(Page.RECIPIENT_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const { recipientId, contactType } = req.query
    let recipient = null

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    let suicideRisk: SuicideRisk = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    const contactTypeDescription = contactTypeMap[contactType as string] || null

    // If recipient id is passed as a param, then load existing recipient as an edit screen
    if (recipientId) {
      try {
        recipient = await suicideRiskApiClient.getRecipient(
          suicideRiskId,
          recipientId as string,
          res.locals.user.username,
        )

        res.render('pages/recipient-details', {
          suicideRiskId,
          recipientId,
          recipient,
          contactTypeDescription,
        })
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
        const showEmbeddedError = true
        res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
      }
    } else {
      // Load as an add screen rather than edit screen if no recipient
      res.render('pages/recipient-details', {
        suicideRiskId,
        recipientId,
        recipient: createDefaultRecipient(suicideRiskId, contactTypeDescription),
        contactTypeDescription,
      })
    }
  })

  router.post('/recipient-details/:id', async (req, res) => {
    const suicideRiskId: string = req.params.id
    const { recipientId, contactType } = req.query
    const callingScreen: string = req.query.returnTo as string
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    let suicideRisk: SuicideRisk = null
    let recipient = null
    let allowedEmailList: string[] = []

    let redirectUrl = `/recipients/${suicideRiskId}`
    if (callingScreen) redirectUrl += `?returnTo=${callingScreen}`

    if (req.body.action === 'cancel') {
      return res.redirect(redirectUrl)
    }

    const contactTypeDescription = contactTypeMap[contactType as string] || null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      return res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
    }

    try {
      // get the authorised email reference data
      const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
      const emailRecipientData: EmailRecipientData = await ndeliusIntegrationApiClient.getRecipientDetails(
        res.locals.user.username,
      )
      if (
        emailRecipientData &&
        emailRecipientData.authorisedEmails &&
        Object.keys(emailRecipientData.authorisedEmails).length > 0
      ) {
        allowedEmailList = emailRecipientData.authorisedEmails.map(({ description }) => description)
      }
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        return res.render(`pages/detailed-error`, { errorMessages })
      }

      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        return res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
      }
      return res.render(`pages/detailed-error`, { errorMessages })
    }

    if (recipientId) {
      try {
        recipient = await suicideRiskApiClient.getRecipient(
          suicideRiskId,
          recipientId as string,
          res.locals.user.username,
        )
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
        const showEmbeddedError = true
        return res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
      }
    }

    if (!recipient) {
      recipient = createDefaultRecipient(suicideRiskId, contactTypeDescription)
    }

    // Set new recipient details
    recipient.contactLocation.officeDescription = req.body.officeDescription || null
    recipient.contactLocation.buildingNumber = req.body.buildingNumber || null
    recipient.contactLocation.buildingName = req.body.buildingName || null
    recipient.contactLocation.streetName = req.body.streetName || null
    recipient.contactLocation.district = req.body.district || null
    recipient.contactLocation.townCity = req.body.townCity || null
    recipient.contactLocation.county = req.body.county || null
    recipient.contactLocation.postcode = req.body.postcode || null
    recipient.emailAddress = req.body.emailAddress || null
    recipient.sendFormViaEmail = parseBooleanField(req.body.sendFormViaEmail)
    recipient.sendFormManually = parseBooleanField(req.body.sendFormManually)
    recipient.contactPerson = req.body.name || null
    recipient.contactDate = new Date().toISOString()

    const errorMessages: ErrorMessages = validateRecipient(recipient, allowedEmailList)
    const hasErrors: boolean = Object.keys(errorMessages).length > 0

    if (hasErrors) {
      // re-render with validation errors
      return res.render('pages/recipient-details', {
        errorMessages,
        suicideRisk,
        recipient,
        currentPage,
        suicideRiskId,
        contactTypeDescription,
      })
    }

    try {
      if (recipientId) {
        // Update existing recipient
        await suicideRiskApiClient.updateRecipient(
          suicideRiskId,
          recipientId as string,
          recipient,
          res.locals.user.username,
        )
      } else {
        // Create new recipient
        await suicideRiskApiClient.createRecipient(suicideRiskId, recipient, res.locals.user.username)
      }
      return res.redirect(redirectUrl)
    } catch (error) {
      const integrationErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      return res.render('pages/recipient-details', {
        errorMessages,
        integrationErrorMessages,
        showEmbeddedError,
        recipient,
        suicideRisk,
        currentPage,
        suicideRiskId,
        contactTypeDescription,
      })
    }
  })

  function validateRecipient(recipient: SuicideRiskContact, allowedRecipientList: string[]): ErrorMessages {
    let errorMessages: ErrorMessages = validateAddress(recipient.contactLocation)

    if (!recipient.contactPerson || recipient.contactPerson.trim() === '') {
      errorMessages.name = {
        text: 'Name: This is a required value, please enter a value',
      }
    } else {
      errorMessages = validateLength(recipient.contactPerson, 'name', 'Name', errorMessages)
    }

    if (recipient.sendFormManually === null || recipient.sendFormManually === undefined) {
      errorMessages.sendFormManually = {
        text: 'Please select an answer to the question Are you going to send this form to this recipient manually?',
      }
    }

    if (recipient.sendFormViaEmail === null || recipient.sendFormViaEmail === undefined) {
      errorMessages.sendFormViaEmail = {
        text: 'Please select an answer to the question Do you want the system to email the completed form to this recipient?',
      }
    }

    if (recipient.emailAddress && recipient.emailAddress.trim() !== '') {
      errorMessages = validateLength(recipient.emailAddress, 'email', 'Email', errorMessages)
    }

    if (recipient.sendFormViaEmail === true && (!recipient.emailAddress || recipient.emailAddress.trim() === '')) {
      errorMessages.email = {
        text: 'You have indicated that you will be emailing the form to a recipient but have not entered the recipients email address. Please enter an email address',
      }
    }

    if (allowedRecipientList && Object.keys(allowedRecipientList).length > 0) {
      if (recipient.sendFormViaEmail && recipient.emailAddress && recipient.emailAddress.trim() !== '') {
        let emailValid = false
        for (const str of allowedRecipientList) {
          if (recipient.emailAddress.includes(str)) {
            emailValid = true
            break
          }
        }

        if (emailValid === false) {
          errorMessages.email = {
            text: 'Please enter an email address from the approved recipient list. Please contact IT for further information',
          }
        }
      }
    }

    return errorMessages
  }

  function validateLength(
    fieldValue: string,
    fieldName: keyof typeof FIELD_LIMITS,
    label: string,
    errorMessages: ErrorMessages,
  ): ErrorMessages {
    const maxLength = FIELD_LIMITS[fieldName]
    if (!fieldValue) return errorMessages

    if (fieldValue.trim().length > maxLength) {
      return {
        ...errorMessages,
        [fieldName]: {
          text: `Please enter ${maxLength} characters or less for ${label}`,
        },
      }
    }

    return errorMessages
  }

  function validateAddress(address: SuicideRiskAddress): ErrorMessages {
    let errorMessages: ErrorMessages = {}
    if (
      (!address.officeDescription || address.officeDescription.trim() === '') &&
      (!address.buildingName || address.buildingName.trim() === '') &&
      (!address.buildingNumber || address.buildingNumber.trim() === '')
    ) {
      errorMessages.identifier = {
        text: 'At least 1 out of [Description, Building Name, Address Number] must be present',
      }
    }

    if (!address.streetName || address.streetName.trim() === '') {
      errorMessages.streetName = {
        text: 'Street Name : This is a required value, please enter a value',
      }
    }

    if (!address.townCity || address.townCity.trim() === '') {
      errorMessages.townCity = {
        text: 'Town/City : This is a required value, please enter a value',
      }
    }

    if (!address.postcode || address.postcode.trim() === '') {
      errorMessages.postcode = {
        text: 'Postcode : This is a required value, please enter a value',
      }
    }

    errorMessages = validateLength(address.officeDescription, 'officeDescription', 'Office Description', errorMessages)
    errorMessages = validateLength(address.buildingName, 'buildingName', 'Building Name', errorMessages)
    errorMessages = validateLength(address.buildingNumber, 'buildingNumber', 'Address Number', errorMessages)
    errorMessages = validateLength(address.streetName, 'streetName', 'Street Name', errorMessages)
    errorMessages = validateLength(address.district, 'district', 'District', errorMessages)
    errorMessages = validateLength(address.townCity, 'townCity', 'Town or City', errorMessages)
    errorMessages = validateLength(address.county, 'county', 'County', errorMessages)
    errorMessages = validateLength(address.postcode, 'postcode', 'Postcode', errorMessages)

    return errorMessages
  }

  function createDefaultRecipient(suicideRiskId: string, contactTypeDescription?: string): SuicideRiskContact {
    return {
      id: null,
      suicideRiskId,
      contactDate: null,
      contactTypeDescription: contactTypeDescription || null,
      contactPerson: null,
      contactLocation: {
        addressId: null,
        officeDescription: null,
        buildingName: null,
        buildingNumber: null,
        county: null,
        status: null,
        streetName: null,
        district: null,
        postcode: null,
        townCity: null,
      },
      emailAddress: null,
      formSent: false,
      sendFormManually: null,
      sendFormViaEmail: null,
    }
  }

  const contactTypeMap: Record<string, string> = {
    COLLEAGUE: 'other_colleagues',
    PRISON: 'prison_establishment',
    POLICE: 'police_custody_cells',
    MEDICAL: 'medical_services',
    OTHER: 'other_agency',
  }

  const FIELD_LIMITS = {
    name: 200,
    officeDescription: 50,
    buildingName: 35,
    buildingNumber: 35,
    streetName: 35,
    district: 35,
    townCity: 35,
    county: 35,
    postcode: 8,
    email: 250,
  }

  return router
}

function parseBooleanField(value: string | boolean | null | undefined): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}
