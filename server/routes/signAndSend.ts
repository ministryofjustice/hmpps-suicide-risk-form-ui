import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'

export default function signAndSendRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'sign-and-send'

  router.get('/sign-and-send/:id', async (req, res, next) => {
    await auditService.logPageView(Page.SIGN_AND_SEND, { who: res.locals.user.username, correlationId: req.id })

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, res)) return

    res.render('pages/sign-and-send', {
      suicideRisk,
      currentPage,
    })
  })

  return router
}
