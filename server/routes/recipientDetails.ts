import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk, SuicideRiskAddress, SuicideRiskContact } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'

export default function recipientsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'recipient-details'

  router.get('/recipient-details/:id', async (req, res, next) => {
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

  router.post('/recipient-details/:id', async (req, res, next) => {
    const suicideRiskId: string = req.params.id
    const { recipientId, contactType } = req.query
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    let suicideRisk: SuicideRisk = null
    let recipient = null

    if (req.body.action === 'cancel') {
      return res.redirect(`/recipients/${suicideRiskId}`)
    }

    const contactTypeDescription = contactTypeMap[contactType as string] || null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      return res.render(`pages/recipient-details`, { errorMessages, showEmbeddedError })
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
    recipient.contactPerson = req.body.name || null
    recipient.contactDate = new Date().toISOString()

    const errorMessages: ErrorMessages = validateRecipient(recipient)
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
      return res.redirect(`/recipients/${suicideRiskId}`)
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

  function validateRecipient(recipient: SuicideRiskContact): ErrorMessages {
    const errorMessages: ErrorMessages = validateAddress(recipient.contactLocation)

    if (!recipient.contactPerson || recipient.contactPerson.trim() === '') {
      errorMessages.name = {
        text: 'Name: This is a required value, please enter a value',
      }
    }

    return errorMessages
  }

  function validateAddress(address: SuicideRiskAddress): ErrorMessages {
    const errorMessages: ErrorMessages = {}

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
    }
  }

  const contactTypeMap: Record<string, string> = {
    COLLEAGUE: 'other_colleagues',
    PRISON: 'prison_establishment',
    POLICE: 'police_custody_cells',
    MEDICAL: 'medical_services',
    OTHER: 'other_agency',
  }

  return router
}
