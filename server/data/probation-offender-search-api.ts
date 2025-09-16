import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class ProbationOffenderSearchApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Probation offender search API', config.apis.probationOffenderSearch, logger, authenticationClient)
  }

  async searchContacts(request: SearchContactsRequest, username: string): Promise<SearchContactsResponse> {
    return this.post(
      {
        path: `/search/contacts`,
        data: request as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }
}

export interface SearchContactsRequest {
  crn: string
  query: string
  matchAllTerms?: boolean
  includeScores?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface SearchContactResult {
  crn: string
  id: number
  typeCode: string
  typeDescription: string
  outcomeCode: string
  outcomeDescription: string
  description: string
  notes: string
  date: string
  startTime: string
  endTime: string
  lastUpdatedDateTime: string
  highlights: Record<string, string[]>
  score: number
}

export interface SearchContactsResponse {
  size: number
  page: number
  totalResults: number
  totalPages: number
  results: SearchContactResult[]
}
