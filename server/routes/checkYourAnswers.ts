import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ZonedDateTime, ZoneId } from '@js-joda/core'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { toUserDate } from '../utils/dateUtils'
import '@js-joda/timezone'

export default function checkYourAnswersRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'check-your-answers'

  router.get('/check-your-answers/:id', async (req, res, next) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk: SuicideRisk = await suicideRiskApiClient.getSuicideRiskById(
      suicideRiskId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return
    const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)
    const dateOfBirth: string = toUserDate(suicideRisk.dateOfBirth)
    const reportValidated = validateReport(suicideRisk)

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

    res.render('pages/check-your-answers', {
      suicideRisk,
      currentPage,
      suicideRiskId,
      dateOfLetter,
      dateOfBirth,
      reportValidated,
      contactsOtherColleagues,
      contactsPrisonEstablishment,
      contactsPoliceCustodyCells,
      contactsMedicalServices,
      contactsOtherAgency,
    })
  })

  router.post('/check-your-answers/:id', async (req, res, next) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const suicideRisk: SuicideRisk = await suicideRiskApiClient.getSuicideRiskById(
      suicideRiskId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return
    suicideRisk.completedDate = ZonedDateTime.now(ZoneId.of('Europe/London'))
    suicideRisk.dateOfLetter = new Date().toISOString()
    await suicideRiskApiClient.updateSuicideRisk(suicideRiskId, suicideRisk, res.locals.user.username)
    res.redirect(`/report-completed/${req.params.id}`)
  })

  function validateReport(suicideRisk: SuicideRisk): boolean {
    return (
      suicideRisk.crn?.trim().length > 0 &&
      suicideRisk.titleAndFullName?.trim().length > 0 &&
      suicideRisk.postalAddress != null &&
      suicideRisk.signature?.trim().length > 0 &&
      suicideRisk.dateOfBirth?.trim().length > 0 &&
      suicideRisk.additionalInfo?.trim().length > 0 &&
      suicideRisk.currentPsychTreatment?.trim().length > 0 &&
      suicideRisk.suicideRiskContactList != null &&
      suicideRisk.suicideRiskContactList.length > 0
    )
  }

  return router
}
