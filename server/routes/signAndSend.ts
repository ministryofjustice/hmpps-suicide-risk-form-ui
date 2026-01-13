import { Request, Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import { ErrorMessages, SelectItem } from '../data/uiModels'
import {
  arrangeSelectItemListAlphabetically,
  formatAddressForSelectMenuDisplay,
  handleIntegrationErrors,
  toSuicideRiskAddress,
} from '../utils/utils'
import NDeliusIntegrationApiClient, { DeliusAddress, SignAndSendDetails } from '../data/ndeliusIntegrationApiClient'
import { toFullUserDate, toUserDate } from '../utils/dateUtils'

export default function signAndSendRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'sign-and-send'

  router.get('/sign-and-send/:id', async (req, res) => {
    await auditService.logPageView(Page.SIGN_AND_SEND, { who: res.locals.user.username, correlationId: req.id })
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    let errorMessages: ErrorMessages = {}

    let suicideRisk: SuicideRisk = null
    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    let userDetails: SignAndSendDetails = null
    try {
      userDetails = await ndeliusIntegrationApiClient.getSignAndSendDetails(res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'NDelius Integration')
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/sign-and-send`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    suicideRisk.telephoneNumber = userDetails.telephoneNumber

    let defaultAddress: DeliusAddress = null
    let onlyAlternateAddressesAvailable: boolean = false
    if (suicideRisk.workAddress == null && userDetails.addresses != null) {
      defaultAddress = userDetails.addresses.find(record => record.status === 'Default')

      if (defaultAddress) {
        suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
      } else if (userDetails.addresses?.length > 0) {
        // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
        // We do not display radio buttons for the user, just a drop-down of the alternate addresses
        onlyAlternateAddressesAvailable = true
      }
    }

    let addressNotAvailable: boolean = false
    if (suicideRisk.workAddress != null && suicideRisk.workAddress.addressId != null && userDetails.addresses != null) {
      const addressPresent = userDetails.addresses.find(record => record.id === suicideRisk.workAddress.addressId)
      if (addressPresent == null) {
        suicideRisk.workAddress = null
        addressNotAvailable = true
        await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

        errorMessages.genericErrorMessage = {
          text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
        }
      }
    }

    let manualAddressAllowed: boolean = false
    if (userDetails.addresses == null || userDetails.addresses.length === 0) {
      manualAddressAllowed = true
    }

    const alternateAddressOptions = addressListToSelectItemList(
      userDetails.addresses,
      suicideRisk.basicDetailsSaved,
      suicideRisk.workAddress?.addressId,
    )

    const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

    res.render('pages/sign-and-send', {
      suicideRisk,
      currentPage,
      suicideRiskId,
      userDetails,
      dateOfLetter,
      alternateAddressOptions,
      addressNotAvailable,
      manualAddressAllowed,
      errorMessages,
      onlyAlternateAddressesAvailable,
    })
  })

  router.post('/sign-and-send/:id', async (req, res) => {
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const suicideRiskId: string = req.params.id
    let suicideRisk: SuicideRisk = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    let userDetails: SignAndSendDetails = null
    try {
      userDetails = await ndeliusIntegrationApiClient.getSignAndSendDetails(res.locals.user.username)
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
        res.render(`pages/sign-and-send`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    if (req.body.action === 'saveProgressAndClose') {
      suicideRisk.signAndSendSaved = true
      suicideRisk.telephoneNumber = userDetails.telephoneNumber
      suicideRisk = handleSelectedAddress(suicideRisk, userDetails, req)
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'clear-signature') {
      suicideRisk.signAndSendSaved = true
      suicideRisk.signature = null
      suicideRisk.sheetSentBy = null
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else if (req.body.action === 'sign') {
      suicideRisk.signAndSendSaved = true
      suicideRisk.signature = createSignatureString(userDetails)
      suicideRisk.sheetSentBy = getOfficerString(userDetails)
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else {
      suicideRisk.signAndSendSaved = true
      suicideRisk.telephoneNumber = userDetails.telephoneNumber
      suicideRisk = handleSelectedAddress(suicideRisk, userDetails, req)
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/check-your-answers/${req.params.id}`)
    }
  })

  function handleSelectedAddress(suicideRisk: SuicideRisk, userDetails: SignAndSendDetails, req: Request): SuicideRisk {
    const risk = suicideRisk
    const selectedAddress = getSelectedAddress(userDetails.addresses, req.body.alternateAddress)
    if (selectedAddress) {
      risk.workAddress = toSuicideRiskAddress(selectedAddress)
    }
    return risk
  }

  function createSignatureString(userDetails: SignAndSendDetails): string {
    let signature: string = ''
    if (userDetails != null && userDetails.name != null) {
      signature += userDetails.name.forename
      if (userDetails.name.middleName != null) {
        signature += ` ${userDetails.name.middleName}`
      }
      signature += ` ${userDetails.name.surname} ${toFullUserDate(new Date().toISOString())}`
    }
    return signature
  }

  function getOfficerString(userDetails: SignAndSendDetails): string {
    let signature: string = ''
    if (userDetails != null && userDetails.name != null) {
      signature += userDetails.name.forename
      if (userDetails.name.middleName != null) {
        signature += ` ${userDetails.name.middleName}`
      }
      signature += ` ${userDetails.name.surname}`
    }
    return signature
  }

  function addressListToSelectItemList(
    addresses: DeliusAddress[],
    breachNoticeSaved: boolean,
    selectedAddressId: number,
  ): SelectItem[] {
    const returnAddressList: SelectItem[] = [
      {
        text: 'Please Select',
        value: '-1',
        selected: true,
      },
    ]
    if (addresses) {
      const orderedAddressList: SelectItem[] = arrangeSelectItemListAlphabetically(
        addresses.map(address => ({
          text: formatAddressForSelectMenuDisplay(address),
          value: `${address.id}`,
          selected: breachNoticeSaved && address.id === selectedAddressId,
        })),
      )

      returnAddressList.push(...orderedAddressList)
    }

    return returnAddressList
  }

  function getSelectedAddress(addressList: DeliusAddress[], addressIdentifier: string): DeliusAddress {
    const addressIdentifierNumber: number = +addressIdentifier
    return addressList.find(address => address.id === addressIdentifierNumber)
  }

  return router
}
