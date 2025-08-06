import { type Response } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { SuicideRisk } from '../data/suicideRiskApiClient'
import NDeliusIntegrationApiClient, { LimitedAccessCheck } from '../data/ndeliusIntegrationApiClient'

export default class CommonUtils {
  constructor() {}

  async redirectRequired(
    suicideRisk: SuicideRisk,
    suicideRiskId: string,
    res: Response,
    authenticationClient: AuthenticationClient,
  ): Promise<boolean> {
    if (suicideRisk.completedDate != null) {
      res.redirect(`/report-completed/${suicideRiskId}`)
      return true
    }

    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const laoCheck: LimitedAccessCheck = await ndeliusIntegrationApiClient.getLimitedAccessCheck(
      suicideRisk.crn,
      res.locals.user.username,
    )
    if (laoCheck.userExcluded || laoCheck.userRestricted) {
      res.render('pages/limited-access', {
        laoCheck,
      })
      return true
    }

    return false
  }
}
