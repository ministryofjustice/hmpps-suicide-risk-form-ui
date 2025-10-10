import { ZonedDateTime } from '@js-joda/core'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class SuicideRiskApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Suicide Risk API', config.apis.suicideRisk, logger, authenticationClient)
  }

  async getSuicideRiskById(uuid: string, username: string): Promise<SuicideRisk> {
    return this.get(
      {
        path: `/suicide-risk/${uuid}`,
      },
      asSystem(username),
    )
  }

  async updateSuicideRisk(id: string, suicideRisk: SuicideRisk, username: string): Promise<SuicideRisk> {
    return this.put(
      {
        path: `/suicide-risk/${id}`,
        data: suicideRisk as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async getPdfById(uuid: string, username: string): Promise<ArrayBuffer> {
    return this.get(
      {
        path: `/suicide-risk/${uuid}/pdf`,
        responseType: 'arraybuffer',
      },
      asSystem(username),
    )
  }

  async getRecipient(suicideRiskId: string, recipientId: string, username: string): Promise<SuicideRiskContact> {
    return this.get(
      {
        path: `/suicide-risk/${suicideRiskId}/recipient/${recipientId}`,
      },
      asSystem(username),
    )
  }

  async createRecipient(
    suicideRiskId: string,
    recipient: SuicideRiskContact,
    username: string,
  ): Promise<SuicideRiskContact> {
    return this.post(
      {
        path: `/suicide-risk/${suicideRiskId}/recipient`,
        data: recipient as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async updateRecipient(
    suicideRiskId: string,
    recipientId: string,
    recipient: SuicideRiskContact,
    username: string,
  ): Promise<SuicideRiskContact> {
    return this.put(
      {
        path: `/suicide-risk/${suicideRiskId}/recipient/${recipientId}`,
        data: recipient as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async deleteRecipient(suicideRiskId: string, recipientId: string, username: string): Promise<SuicideRisk> {
    return this.delete(
      {
        path: `/suicide-risk/${suicideRiskId}/recipient/${recipientId}`,
      },
      asSystem(username),
    )
  }
}

export interface SuicideRisk {
  crn: string
  titleAndFullName: string
  dateOfLetter: string
  sheetSentBy: string
  telephoneNumber: string
  signature: string
  completedDate: ZonedDateTime
  natureOfRisk: string
  riskIsGreatestWhen: string
  riskIncreasesWhen: string
  riskDecreasesWhen: string
  additionalInfo: string
  currentPsychTreatment: string
  postalAddress: SuicideRiskAddress
  dateOfBirth: string
  prisonNumber: string
  workAddress: SuicideRiskAddress
  basicDetailsSaved: boolean
  informationSaved: boolean
  treatmentSaved: boolean
  signAndSendSaved: boolean
  contactSaved: boolean
  reviewRequiredDate: string
  reviewEvent: string
  suicideRiskContactList: SuicideRiskContact[]
}

export interface SuicideRiskContact {
  id: string
  suicideRiskId: string
  contactDate: string
  contactTypeDescription: string
  contactPerson: string
  contactLocation: SuicideRiskAddress
  emailAddress: string
  formSent: boolean
  sendFormManually: boolean
  sendFormViaEmail: boolean
}

export interface SuicideRiskAddress {
  id?: string
  addressId: number
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
