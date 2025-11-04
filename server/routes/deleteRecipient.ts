import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import CommonUtils from '../services/commonUtils'

export default function deleteRecipientRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  router.get('/delete-recipient/:suicideRiskId/:recipientId', async (req, res) => {
    await auditService.logPageView(Page.DELETE_RECIPIENT, { who: res.locals.user.username, correlationId: req.id })
    const { suicideRiskId, recipientId } = req.params
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk: SuicideRisk = await suicideRiskApiClient.getSuicideRiskById(
      suicideRiskId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return
    res.render('pages/delete-recipient', { suicideRiskId, recipientId })
  })

  router.post('/delete-recipient/:suicideRiskId/:recipientId', async (req, res) => {
    await auditService.logPageView(Page.DELETE_RECIPIENT, { who: res.locals.user.username, correlationId: req.id })
    const { suicideRiskId, recipientId } = req.params
    const callingScreen: string = req.query.returnTo as string
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)

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
        await suicideRiskApiClient.deleteRecipient(suicideRiskId, recipientId, res.locals.user.username)
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
        const showEmbeddedError = true
        res.render(`pages/detailed-error`, { errorMessages, showEmbeddedError })
        return
      }
    }
    let redirectUrl = `/recipients/${suicideRiskId}`
    if (callingScreen) redirectUrl += `?returnTo=${callingScreen}`
    res.redirect(redirectUrl)
  })

  return router
}
