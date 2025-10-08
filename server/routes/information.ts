import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import AssessRiskAndNeedsApiClient, { RiskAssessment } from '../data/assessRiskAndNeedsApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import config from '../config'
import NDeliusIntegrationApiClient, { Registration } from '../data/ndeliusIntegrationApiClient'
import CommonUtils from '../services/commonUtils'

export default function informationRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'information'

  router.get('/information/:id', async (req, res) => {
    await auditService.logPageView(Page.INFORMATION, { who: res.locals.user.username, correlationId: req.id })
    const assessRiskAndNeedsApiClient = new AssessRiskAndNeedsApiClient(authenticationClient)
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const integrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    let errorMessages: ErrorMessages = null
    const suicideRiskId = req.params.id
    let crn = null
    let suicideRisk: SuicideRisk = null
    let riskAssessment: RiskAssessment = null
    let registration: Registration = null
    let registrationDeeplink = null

    try {
      // get existing suicide risk and use crn for calls to other services
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
      crn = suicideRisk.crn
      registrationDeeplink = `${config.ndeliusDeeplink.url}?component=RegisterSummary&CRN=${crn}`
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/information`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    try {
      // get risk assessment from assess risk and needs service
      riskAssessment = await assessRiskAndNeedsApiClient.getRisksSummary(crn, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Hmpps Assess Risk and Needs')
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/information`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    try {
      // get registration details from integration service
      const response = await integrationApiClient.getSuicideRiskInformation(crn, res.locals.user.username)
      registration = response.registration ?? null
    } catch (error) {
      // get risk assessment from assess risk and needs service
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'NDelius Integration')
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/information`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const showRiskAndNeedsDetailsTwisty = !!(
      riskAssessment &&
      ((riskAssessment.natureOfRisk && riskAssessment.natureOfRisk.trim() !== '') ||
        (riskAssessment.riskImminence && riskAssessment.riskImminence.trim() !== '') ||
        (riskAssessment.riskIncreaseFactors && riskAssessment.riskIncreaseFactors.trim() !== '') ||
        (riskAssessment.riskMitigationFactors && riskAssessment.riskMitigationFactors.trim() !== ''))
    )

    res.render('pages/information', {
      riskAssessment,
      registration,
      currentPage,
      suicideRisk,
      suicideRiskId,
      registrationDeeplink,
      showRiskAndNeedsDetailsTwisty,
    })
  })

  router.post('/information/:id', async (req, res) => {
    const suicideRiskId: string = req.params.id
    let crn = null
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const assessRiskAndNeedsApiClient = new AssessRiskAndNeedsApiClient(authenticationClient)
    let suicideRisk: SuicideRisk = null
    let riskAssessment: RiskAssessment = null
    const { additionalInfo } = req.body
    const callingScreen: string = req.query.returnTo as string
    let errorMessages: ErrorMessages = {}

    try {
      // get existing suicide risk and use crn for calls to other services
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
      crn = suicideRisk.crn
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/information`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      // get risk assessment from assess risk and needs service
      riskAssessment = await assessRiskAndNeedsApiClient.getRisksSummary(crn, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Hmpps Assess Risk and Needs')
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/information`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    if (riskAssessment != null) {
      suicideRisk.natureOfRisk = riskAssessment.natureOfRisk
      suicideRisk.riskIsGreatestWhen = riskAssessment.riskImminence
      suicideRisk.riskIncreasesWhen = riskAssessment.riskIncreaseFactors
      suicideRisk.riskDecreasesWhen = riskAssessment.riskMitigationFactors
    }

    suicideRisk.additionalInfo = additionalInfo
    suicideRisk.informationSaved = true

    // validate additional info field
    if (suicideRisk?.additionalInfo?.length > 20000) {
      errorMessages.additionalInfo = {
        text: 'Additional information must be 20000 characters or fewer',
      }
      const showEmbeddedError = true
      res.render(`pages/information`, { errorMessages, showEmbeddedError, suicideRisk })
      return
    }

    await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
    if (req.body.action === 'saveProgressAndClose') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/information/${req.params.id}`)
    } else if (callingScreen && callingScreen === 'check-your-report') {
      res.redirect(`/check-your-answers/${req.params.id}`)
    } else {
      res.redirect(`/treatment/${req.params.id}`)
    }
  })
  return router
}
