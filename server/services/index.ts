import { dataAccess } from '../data'
import AuditService from './auditService'
import CommonUtils from './commonUtils'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient } = dataAccess()
  const commonUtils = new CommonUtils()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    hmppsAuthClient,
    commonUtils,
  }
}

export type Services = ReturnType<typeof services>
