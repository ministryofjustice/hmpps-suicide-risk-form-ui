import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk, SuicideRiskAddress } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'

export default function updateWorkAddressRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'sign-and-send'

  router.get('/update-work-address/:id', async (req, res, next) => {
    await auditService.logPageView(Page.SIGN_AND_SEND, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)

    let suicideRisk: SuicideRisk = null
    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/update-work-address`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    res.render('pages/update-work-address', {
      suicideRisk,
      currentPage,
      suicideRiskId,
    })
  })

  router.post('/update-work-address/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/update-work-address`, { errorMessages, showEmbeddedError })
      return
    }

    if (suicideRisk.workAddress == null) {
      suicideRisk.workAddress = {
        addressId: null,
        buildingName: null,
        buildingNumber: null,
        officeDescription: null,
        county: null,
        status: null,
        streetName: null,
        district: null,
        postcode: null,
        townCity: null,
      }
    }

    suicideRisk.workAddress.officeDescription = req.body.officeDescription
    suicideRisk.workAddress.buildingNumber = req.body.buildingNumber
    suicideRisk.workAddress.buildingName = req.body.buildingName
    suicideRisk.workAddress.streetName = req.body.streetName
    suicideRisk.workAddress.district = req.body.district
    suicideRisk.workAddress.townCity = req.body.townCity
    suicideRisk.workAddress.county = req.body.county
    suicideRisk.workAddress.postcode = req.body.postcode

    const errorMessages: ErrorMessages = validateAddress(suicideRisk.workAddress)
    const hasErrors: boolean = Object.keys(errorMessages).length > 0

    if (!hasErrors) {
      try {
        await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
        res.redirect(`/sign-and-send/${req.params.id}`)
      } catch (error) {
        const integrationErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Breach Notice')
        const showEmbeddedError = true
        // always stay on page and display the error when there are isssues retrieving the breach notice
        res.render(`pages/update-work-address`, { errorMessages, showEmbeddedError, integrationErrorMessages })
      }
    } else {
      res.render('pages/update-work-address', { errorMessages, suicideRisk, currentPage, suicideRiskId })
    }
  })

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

  return router
}
