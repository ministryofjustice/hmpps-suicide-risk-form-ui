import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class NDeliusIntegrationApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('NDelius Integration API', config.apis.ndeliusIntegration, logger, authenticationClient)
  }

  async getBasicDetails(crn: string, username: string): Promise<BasicDetails> {
    return this.get(
      {
        path: `/basic-details/${crn}/${username}`,
      },
      asSystem(username),
    )
  }

  async getSuicideRiskInformation(crn: string, username: string): Promise<Registration> {
    return this.get(
      {
        path: `/suicide-risk-information/crn/${crn}`,
      },
      asSystem(username),
    )
  }

  async getLimitedAccessCheck(crn: string, username: string): Promise<LimitedAccessCheck> {
    return this.get({
      path: `/users/${username}/access/${crn}`,
    })
  }

  async getSignAndSendDetails(username: string): Promise<BasicDetails> {
    return this.get(
      {
        path: `/sign-and-send/${username}`,
      },
      asSystem(username),
    )
  }

  async getDocumentsForContacts(request: ContactDocSearchRequest, username: string): Promise<ContactDocSearchResponse> {
    return this.post(
      {
        path: `/treatment`,
        data: request as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }
}

export interface ContactDocSearchRequest {
  contactIds: number[];
}

export interface DocumentDetails {
  id: number;
  name: string;
  lastUpdated: string;
}

export interface ContactDocSearchResponseItem {
  id: number;
  documents: DocumentDetails[];
}

export interface ContactDocSearchResponse {
  content: ContactDocSearchResponseItem[];
}

export interface LimitedAccessCheck {
  crn: string
  userExcluded: boolean
  exclusionMessage?: string
  userRestricted: boolean
  restrictionMessage?: string
}

export interface Name {
  forename: string
  middleName: string
  surname: string
}

export interface BasicDetails {
  title: string
  name: Name
  addresses: DeliusAddress[]
  dateOfBirth: string
  prisonNumber: string
}

export interface DeliusAddress {
  id: number
  status: string
  officeDescription?: string
  buildingName: string
  buildingNumber: string
  streetName: string
  townCity: string
  district: string
  county: string
  postcode: string
}

export interface SignAndSendDetails {
  name: Name
  telephoneNumber?: string
  emailAddress?: string
  addresses: DeliusAddress[]
}

export interface Registration {
  id?: string
  type: ReferenceData
  startDate: string
  endDate: string
  notes: string
  documentsLinked: boolean
  deregistered: false
}

export interface ReferenceData {
  code: string
  description: string
}
