import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk, SuicideRiskAddress } from '../data/suicideRiskApiClient'
import NDeliusIntegrationApiClient, { BasicDetails, DeliusAddress, Name } from '../data/ndeliusIntegrationApiClient'
import { handleIntegrationErrors } from '../utils/utils'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'

export default function basicDetailsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'basic-details'

  router.get('/basic-details/:id', async (req, res) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null
    let basicDetails: BasicDetails = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.data?.status,
        error?.data?.userMessage,
        'Suicide Risk',
      )

      // Navigate to the detailed error page on 400
      if (error?.data?.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.data?.status === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(suicideRisk.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const age = calculateAge(basicDetails.dateOfBirth)
    const defaultAddress: DeliusAddress = findDefaultAddressInAddressList(basicDetails.addresses)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { prisonNumber } = basicDetails

    res.render('pages/basic-details', {
      suicideRisk,
      suicideRiskId,
      basicDetails,
      age,
      defaultAddress,
      titleAndFullName,
      prisonNumber,
      currentPage,
    })
  })

  router.post('/basic-details/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null
    let basicDetails: BasicDetails = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(suicideRisk.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const dob = toIsoDateFormat(basicDetails.dateOfBirth)
    const defaultAddress: DeliusAddress = findDefaultAddressInAddressList(basicDetails.addresses)
    const suicideRiskDefaultAddress: SuicideRiskAddress = toSuicideRiskAddress(defaultAddress)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { prisonNumber } = basicDetails

    suicideRisk.dateOfBirth = dob
    suicideRisk.titleAndFullName = titleAndFullName
    suicideRisk.postalAddress = suicideRiskDefaultAddress
    suicideRisk.prisonNumber = prisonNumber
    suicideRisk.basicDetailsSaved = true

    await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

    if (req.body.action === 'saveProgressAndClose') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/basic-details/${req.params.id}`)
    } else {
      res.redirect(`/information/${req.params.id}`)
    }
    if (await commonUtils.redirectRequired(suicideRisk, res)) return
  })
  return router
}

function findDefaultAddressInAddressList(addressList: Array<DeliusAddress>): DeliusAddress {
  if (!Array.isArray(addressList) || addressList.length === 0) {
    return null
  }

  return (
    addressList.find(a => a.status === 'Default') ??
    addressList.find(a => a.status === 'Postal') ??
    addressList.find(a => a.status === 'Main') ??
    null
  )
}

function toIsoDateFormat(dateStr: string): string {
  if (dateStr && dateStr.trim().length > 0) {
    const [day, month, year] = dateStr.split('/').map(Number)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return ''
}

function formatTitleAndFullName(title: string, name: Name): string {
  return `${title} ${name.forename ?? ''} ${name.middleName ?? ''} ${name.surname ?? ''}`
}

export function calculateAge(dobString: string): string {
  if (dobString && dobString.trim().length > 0) {
    const [day, month, year] = dobString.split('/').map(Number)

    const dob = new Date(year, month - 1, day)
    const today = new Date()

    let age = today.getFullYear() - dob.getFullYear()

    const hasHadBirthday =
      today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())

    if (!hasHadBirthday) {
      age -= 1
    }

    return age.toString()
  }
  return ''
}

function toSuicideRiskAddress(deliusAddress: DeliusAddress): SuicideRiskAddress {
  if (!deliusAddress) {
    return null
  }
  return {
    addressId: deliusAddress.id,
    status: deliusAddress.status,
    officeDescription: deliusAddress.officeDescription,
    buildingName: deliusAddress.buildingName,
    buildingNumber: deliusAddress.buildingNumber,
    streetName: deliusAddress.streetName,
    townCity: deliusAddress.townCity,
    district: deliusAddress.district,
    county: deliusAddress.county,
    postcode: deliusAddress.postcode,
  }
}
