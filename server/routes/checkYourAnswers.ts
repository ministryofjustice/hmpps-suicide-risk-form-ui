import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ZonedDateTime, ZoneId } from '@js-joda/core'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { toUserDate } from '../utils/dateUtils'
import '@js-joda/timezone'

export default function checkYourAnswersRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'check-your-answers'

  router.get('/check-your-answers/:id', async (req, res, next) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)
    const dateOfBirth: string = toUserDate(suicideRisk.dateOfBirth)

    const reportValidated = validateReport(suicideRisk)

    res.render('pages/check-your-answers', {
      suicideRisk,
      currentPage,
      suicideRiskId,
      dateOfLetter,
      dateOfBirth,
      reportValidated,
    })
  })

  router.post('/check-your-answers/:id', async (req, res, next) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, res)) return

    suicideRisk.completedDate = ZonedDateTime.now(ZoneId.of('Europe/London'))
    await suicideRiskApiClient.updateSuicideRisk(suicideRiskId, suicideRisk, res.locals.user.username)
    res.redirect(`/report-completed/${req.params.id}`)
  })

  function validateReport(suicideRisk: SuicideRisk): boolean {
    return (
      suicideRisk.crn != null &&
      suicideRisk.titleAndFullName != null &&
      suicideRisk.postalAddress != null &&
      suicideRisk.dateOfLetter != null &&
      suicideRisk.signature != null &&
      suicideRisk.dateOfBirth != null &&
      suicideRisk.additionalInfo != null &&
      suicideRisk.currentPsychTreatment != null &&
      suicideRisk.suicideRiskContactList != null &&
      suicideRisk.suicideRiskContactList.length > 0
    )
  }

  return router
}
