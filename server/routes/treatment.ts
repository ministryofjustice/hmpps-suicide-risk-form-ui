import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'

export default function treatmentRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'treatment'

  router.get('/treatment/:id', async (req, res, next) => {
    await auditService.logPageView(Page.TREATMENT, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    res.render('pages/treatment', {
      suicideRisk,
      currentPage,
      suicideRiskId,
    })
  })

  return router
}
