import { Router } from 'express'

import type { Services } from '../services'
import basicDetailsRoutes from './basicDetails'

export default function routes({ auditService, hmppsAuthClient }: Services): Router {
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

  basicDetailsRoutes(router, auditService, hmppsAuthClient)
  return router
}
