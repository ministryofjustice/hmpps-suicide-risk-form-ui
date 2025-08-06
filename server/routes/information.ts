import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'

export default function informationRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'information'

  router.get('/information/:id', async (req, res, next) => {
    await auditService.logPageView(Page.INFORMATION, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)
    const suicideRiskId: string = req.params.id
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    res.render('pages/information', {
      suicideRisk,
      currentPage,
      suicideRiskId,
    })
  })

  return router
}
