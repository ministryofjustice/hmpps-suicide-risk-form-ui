import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { toUserDate } from '../utils/dateUtils'

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
    let suicideRisk: SuicideRisk = null

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, res)) return

    const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)
    const dateOfBirth: string = toUserDate(suicideRisk.dateOfBirth)

    res.render('pages/check-your-answers', {
      suicideRisk,
      currentPage,
      suicideRiskId,
      dateOfLetter,
      dateOfBirth,
    })
  })

  return router
}
