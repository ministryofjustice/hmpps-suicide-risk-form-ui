import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'

export default function recipientsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'recipients'

  router.get('/recipients/:id', async (req, res, next) => {
    await auditService.logPageView(Page.INFORMATION, { who: res.locals.user.username, correlationId: req.id })

    const suicideRiskId: string = req.params.id

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, res)) return

    res.render('pages/recipients', {
      suicideRisk,
      currentPage,
      suicideRiskId,
    })
  })

  return router
}
