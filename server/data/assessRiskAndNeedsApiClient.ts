import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class AssessRiskAndNeedsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('NDelius Integration API', config.apis.assessRisksAndNeeds, logger, authenticationClient)
  }

  async getRisksSummary(crn: string, username: string): Promise<RiskAssessment> {
    return this.get(
      {
        path: `/risks/crn/${crn}/summary`,
      },
      asSystem(username),
    )
  }
}

export interface RiskAssessment {
  whoIsAtRisk: string
  natureOfRisk: string
  riskImminence: string
  riskIncreaseFactors: string
  riskMitigationFactors: string
  riskInCommunity: {
    HIGH: string[]
    MEDIUM: string[]
    LOW: string[]
  }
  riskInCustody: {
    HIGH: string[]
    VERY_HIGH: string[]
    LOW: string[]
  }
  assessedOn: string
  overallRiskLevel: string
}
