import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk, SuicideRiskAddress } from '../data/suicideRiskApiClient'
import NDeliusIntegrationApiClient, { BasicDetails, DeliusAddress } from '../data/ndeliusIntegrationApiClient'
import {
  findDefaultAddressInAddressList,
  formatTitleAndFullName,
  handleIntegrationErrors,
  toSuicideRiskAddress,
} from '../utils/utils'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { calculateAge, toFullUserDate } from '../utils/dateUtils'

export default function basicDetailsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'basic-details'

  router.get('/basic-details/:id', async (req, res) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null
    let basicDetails: BasicDetails = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
      if (Object.keys(suicideRisk).length === 0) {
        const errorMessages: ErrorMessages = {}
        errorMessages.genericErrorMessage = {
          text: 'The document has not been found or has been deleted. An error has been logged. 404',
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.data?.status,
        error?.data?.userMessage,
        'Suicide Risk',
      )

      // Navigate to the detailed error page on 400
      if (error?.data?.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.data?.status === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(suicideRisk.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const age = calculateAge(basicDetails.dateOfBirth)
    const formattedDob = toFullUserDate(basicDetails.dateOfBirth)
    const defaultAddress: DeliusAddress = findDefaultAddressInAddressList(basicDetails.addresses)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { prisonNumber } = basicDetails

    res.render('pages/basic-details', {
      suicideRisk,
      suicideRiskId,
      basicDetails,
      age,
      formattedDob,
      defaultAddress,
      titleAndFullName,
      prisonNumber,
      currentPage,
    })
  })

  router.post('/basic-details/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null
    let basicDetails: BasicDetails = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(suicideRisk.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const defaultAddress: DeliusAddress = findDefaultAddressInAddressList(basicDetails.addresses)
    const suicideRiskDefaultAddress: SuicideRiskAddress = toSuicideRiskAddress(defaultAddress)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { prisonNumber } = basicDetails

    suicideRisk.dateOfBirth = basicDetails.dateOfBirth
    suicideRisk.titleAndFullName = titleAndFullName
    suicideRisk.postalAddress = suicideRiskDefaultAddress
    suicideRisk.prisonNumber = prisonNumber
    suicideRisk.basicDetailsSaved = true

    await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

    if (req.body.action === 'saveProgressAndClose') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/basic-details/${req.params.id}`)
    } else if (callingScreen && callingScreen === 'check-your-report') {
      res.redirect(`/check-your-answers/${req.params.id}`)
    } else {
      res.redirect(`/information/${req.params.id}`)
    }
  })
  return router
}
