import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient from '../data/suicideRiskApiClient'
import NDeliusIntegrationApiClient from '../data/ndeliusIntegrationApiClient'

export default function basicDetailsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  const currentPage = 'basic-details'

  router.get('/basic-details/:id', async (req, res, next) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)

    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(suicideRisk.crn, res.locals.user.username)

    res.render('pages/basic-details', {
      suicideRisk,
      basicDetails,
      currentPage,
    })
  })

  return router
}
