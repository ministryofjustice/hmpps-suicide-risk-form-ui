import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import { IntegrationError } from '../data/ndeliusIntegrationApiClient'

export default function confirmDeleteRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/confirm-delete/:id', async (req, res) => {
    await auditService.logPageView(Page.CONFIRM_DELETE, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    res.render('pages/confirm-delete', { suicideRiskId })
  })

  router.post('/confirm-delete/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRiskId: string = req.params.id

    if (req.body.action === 'confirm') {
      try {
        const suicideRisk: SuicideRisk = await suicideRiskApiClient.getSuicideRiskById(
          suicideRiskId,
          res.locals.user.username,
        )
        if (Object.keys(suicideRisk).length === 0) {
          const errorMessages: ErrorMessages = {}
          errorMessages.genericErrorMessage = {
            text: 'The document has not been found or has been deleted. An error has been logged. 404',
          }
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        await suicideRiskApiClient.deleteSuicideRisk(suicideRiskId, res.locals.user.username)
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(error, 'Suicide Risk')
        const showEmbeddedError = true
        const httpError: IntegrationError = error as unknown as IntegrationError
        // take the user to detailed error page for 404
        if (httpError.responseStatus === 404) {
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        res.render(`pages/confirm-delete`, { errorMessages, showEmbeddedError })
        return
      }
      res.redirect(`/form-deleted/${suicideRiskId}`)
    } else {
      res.redirect(`/check-your-answers/${suicideRiskId}`)
    }
  })

  return router
}
