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

  async deleteSuicideRisk(suicideRiskId: string, username: string) {
    return this.delete(
      {
        path: `/suicide-risk/${suicideRiskId}`,
      },
      asSystem(username),
    )
  }
}

export interface SuicideRisk {
  crn: string
  titleAndFullName: string
  dateOfLetter: string
  sheetSentBy: string | null
  telephoneNumber: string
  officerEmailAddress: string
  signature: string | null| undefined
  signedByRo: boolean | null
  completedDate: ZonedDateTime
  natureOfRisk: string
  riskIsGreatestWhen: string
  riskIncreasesWhen: string
  riskDecreasesWhen: string
  additionalInfo: string
  currentPsychTreatment: string
  postalAddress: SuicideRiskAddress | null
  dateOfBirth: string
  nomsNumber: string
  workAddress: SuicideRiskAddress | null | undefined
  basicDetailsSaved: boolean
  informationSaved: boolean
  treatmentSaved: boolean
  signAndSendSaved: boolean
  contactSaved: boolean
  reviewRequiredDate: string
  reviewEvent: string
  suicideRiskContactList: SuicideRiskContact[]
  terminated: boolean
  terminatedUnterminatedDate: Date
}

export interface SuicideRiskContact {
  id: string | null
  suicideRiskId: string | null
  contactDate: string | null
  contactTypeDescription: string | null
  contactPerson: string | null
  contactLocation: SuicideRiskAddress
  emailAddress: string | null
  formSent: boolean | null
  sendFormManually: boolean | null
  sendFormViaEmail: boolean | null
}

export interface SuicideRiskAddress {
  id?: string | null | undefined
  addressId: number | null | undefined
  status: string | null
  officeDescription?: string | null
  buildingName: string | null
  buildingNumber: string | null
  streetName: string | null
  townCity: string | null
  district: string | null
  county: string | null
  postcode: string | null
}
