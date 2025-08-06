import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import CommonUtils from '../services/commonUtils'
import SuicideRiskApiClient from '../data/suicideRiskApiClient'

export default function pdfMaintenanceRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  router.get('/pdf/:id', async (req, res, next) => {
    await auditService.logPageView(Page.VIEW_PDF, { who: res.locals.user.username, correlationId: req.id })

    const suicideRiskId: string = req.params.id

    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(req.params.id as string, res.locals.user.username)

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    try {
      const stream: ArrayBuffer = await suicideRiskApiClient.getDraftPdfById(suicideRiskId, res.locals.user.username)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `filename="suicide_risk_form_${suicideRisk.crn}_draft.pdf"`)
      res.send(stream)
    } catch (error) {
      res.render(`pages/pdf-generation-failed`)
    }
  })

  return router
}
