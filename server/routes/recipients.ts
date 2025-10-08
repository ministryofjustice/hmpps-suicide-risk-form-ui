import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'

export default function recipientsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'recipients'

  router.get('/recipients/:id', async (req, res) => {
    await auditService.logPageView(Page.RECIPIENTS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    if (suicideRisk?.suicideRiskContactList?.length > 0) {
      const contactsOtherColleagues = suicideRisk.suicideRiskContactList?.filter(
        c => c.contactTypeDescription === 'other_colleagues',
      )
      const contactsPrisonEstablishment = suicideRisk.suicideRiskContactList?.filter(
        c => c.contactTypeDescription === 'prison_establishment',
      )
      const contactsPoliceCustodyCells = suicideRisk.suicideRiskContactList?.filter(
        c => c.contactTypeDescription === 'police_custody_cells',
      )
      const contactsMedicalServices = suicideRisk.suicideRiskContactList?.filter(
        c => c.contactTypeDescription === 'medical_services',
      )
      const contactsOtherAgency = suicideRisk.suicideRiskContactList?.filter(
        c => c.contactTypeDescription === 'other_agency',
      )

      res.render('pages/recipients', {
        suicideRisk,
        currentPage,
        suicideRiskId,
        contactsOtherColleagues,
        contactsPrisonEstablishment,
        contactsPoliceCustodyCells,
        contactsMedicalServices,
        contactsOtherAgency,
      })
    } else {
      res.render('pages/recipients', {
        suicideRisk,
        currentPage,
        suicideRiskId,
      })
    }
  })

  router.post('/recipients/:id', async (req, res) => {
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string
    let suicideRisk: SuicideRisk = null
    let errorMessages: ErrorMessages = {}

    // Get existing suicide risk record information
    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/recipients`, { errorMessages, showEmbeddedError })
      return
    }

    suicideRisk.contactSaved = true

    await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

    if (req.body.action === 'saveProgressAndClose') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/recipients/${req.params.id}`)
    } else if (callingScreen && callingScreen === 'check-your-report') {
      res.redirect(`/check-your-answers/${req.params.id}`)
    } else {
      res.redirect(`/sign-and-send/${req.params.id}`)
    }
  })

  return router
}
