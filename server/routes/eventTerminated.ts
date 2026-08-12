import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import SuicideRiskApiClient from '../data/suicideRiskApiClient'

export default function eventTerminatedRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/event-terminated/:id', async (req, res) => {
    await auditService.logPageView(Page.EVENT_TERMINATED, { who: res.locals.user.username, correlationId: req.id })
    const { id } = req.params
    res.render('pages/event-terminated', { id, confirmScreen: false })
  })

  router.post('/event-terminated/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const { id } = req.params

    if (req.body.action === 'delete') {
      res.render('pages/event-terminated', { id, confirmScreen: true })
    } else if (req.body.action === 'cancel') {
      res.render('pages/event-terminated', { id, confirmScreen: false })
    } else if (req.body.action === 'confirm') {
      try {
        const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(id as string, res.locals.user.username)
        if (Object.keys(suicideRisk).length === 0) {
          const errorMessages: ErrorMessages = {}
          errorMessages.genericErrorMessage = {
            text: 'The document has not been found or has been deleted. An error has been logged. 404',
          }
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        await suicideRiskApiClient.deleteSuicideRisk(id as string, res.locals.user.username)
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(
          error.responseStatus,
          error.data?.message,
          'Suicide Risk',
        )
        const showEmbeddedError = true
        res.render(`pages/detailed-error`, { errorMessages, showEmbeddedError })
        return
      }
      res.redirect(`/report-deleted/${id}`)
    } else {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    }
  })

  return router
}
