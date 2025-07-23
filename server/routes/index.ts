import { Router } from 'express'

import type { Services } from '../services'
import basicDetailsRoutes from './basicDetails'
import informationRoutes from './information'
import treatmentRoutes from './treatment'
import recipientsRoutes from './recipients'
import signAndSendRoutes from './signAndSend'
import checkYourAnswersRoutes from './checkYourAnswers'
import reportCompletedRoutes from './reportCompleted'

export default function routes({ auditService, hmppsAuthClient, commonUtils }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    res.render('pages/index')
  })

  router.get('/suicide-risk/:id', async (req, res, next) => {
    res.redirect(`/basic-details/${req.params.id}`)
  })

  router.get('/close', async (req, res, next) => {
    res.send(
      `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
    )
  })

  basicDetailsRoutes(router, auditService, hmppsAuthClient, commonUtils)
  informationRoutes(router, auditService, hmppsAuthClient, commonUtils)
  treatmentRoutes(router, auditService, hmppsAuthClient, commonUtils)
  recipientsRoutes(router, auditService, hmppsAuthClient, commonUtils)
  signAndSendRoutes(router, auditService, hmppsAuthClient, commonUtils)
  checkYourAnswersRoutes(router, auditService, hmppsAuthClient, commonUtils)
  reportCompletedRoutes(router, auditService, hmppsAuthClient)
  return router
}
