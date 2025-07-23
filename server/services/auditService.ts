import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  BASIC_DETAILS = 'BASIC_DETAILS',
  INFORMATION = 'INFORMATION',
  TREATMENT = 'TREATMENT',
  SIGN_AND_SEND = 'SIGN_AND_SEND',
  CHECK_YOUR_ANSWERS = 'CHECK_YOUR_ANSWERS',
  REPORT_COMPLETED = 'REPORT_COMPLETED',
}

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
