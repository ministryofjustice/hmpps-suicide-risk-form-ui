import { Router } from 'express'
import AuditService, { Page } from '../services/auditService'

export default function reportDeletedRoutes(router: Router, auditService: AuditService): Router {
  router.get('/form-deleted/:id', async (req, res) => {
    await auditService.logPageView(Page.FORM_DELETED, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/form-deleted')
  })
  return router
}
