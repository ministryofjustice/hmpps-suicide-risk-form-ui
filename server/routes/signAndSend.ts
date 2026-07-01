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
import NDeliusIntegrationApiClient, {
  DeliusAddress,
  PersonDetails,
  ResponsibleOfficerDetails,
  SignAndSendDetails,
  UserDetails,
} from '../data/ndeliusIntegrationApiClient'
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
    const currentUserDisplayName = res.locals.user.displayName
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

    let signAndSendDetails: SignAndSendDetails = null
    try {
      signAndSendDetails = await ndeliusIntegrationApiClient.getSignAndSendDetails(
        suicideRisk.crn,
        res.locals.user.username,
      )
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

    // always use number from NDelius if available and fall back to saved one
    if (signAndSendDetails.responsibleOfficer?.telephoneNumber != null) {
      suicideRisk.telephoneNumber = signAndSendDetails.responsibleOfficer.telephoneNumber
    }

    if (signAndSendDetails.responsibleOfficer?.emailAddress != null) {
      suicideRisk.officerEmailAddress = signAndSendDetails.responsibleOfficer.emailAddress
    }

    let defaultAddress: DeliusAddress = null
    let onlyAlternateAddressesAvailable: boolean = false
    if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer?.addresses != null) {
      defaultAddress = signAndSendDetails.responsibleOfficer?.addresses?.find(record => record.status === 'Default')

      if (defaultAddress) {
        suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
      } else if (signAndSendDetails.responsibleOfficer?.addresses?.length > 0) {
        // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
        // We do not display radio buttons for the user, just a drop-down of the alternate addresses
        onlyAlternateAddressesAvailable = true
      }
    }

    let addressNotAvailable: boolean = false
    if (
      suicideRisk.workAddress != null &&
      suicideRisk.workAddress.addressId != null &&
      signAndSendDetails.responsibleOfficer?.addresses != null
    ) {
      const addressPresent = signAndSendDetails.responsibleOfficer?.addresses?.find(
        record => record.id === suicideRisk.workAddress?.addressId,
      )
      if (addressPresent == null) {
        suicideRisk.workAddress = null
        addressNotAvailable = true
        await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

        errorMessages.missingPreviouslySelectedAddress = {
          text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
        }
      }
    }

    let manualAddressAllowed: boolean = false
    if (
      signAndSendDetails.responsibleOfficer?.addresses == null ||
      signAndSendDetails.responsibleOfficer?.addresses.length === 0
    ) {
      manualAddressAllowed = true
    }

    const alternateAddressOptions = addressListToSelectItemList(
      signAndSendDetails.responsibleOfficer?.addresses,
      suicideRisk.basicDetailsSaved,
      suicideRisk.workAddress?.addressId,
    )

    const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

    res.render('pages/sign-and-send', {
      suicideRisk,
      currentPage,
      suicideRiskId,
      signAndSendDetails,
      currentUserDisplayName,
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
    const formSentBy: string = req.body.whoIsSendingTheForm || null
    const officerEmailAddress: string = req.body.officerEmailAddress || null
    const officerTelephoneNumber: string = req.body.officerTelephoneNumber || null
    let suicideRisk: SuicideRisk = null
    let errorMessages: ErrorMessages = {}
    let signAndSendDetails: SignAndSendDetails = null

    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/sign-and-send`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      signAndSendDetails = await ndeliusIntegrationApiClient.getSignAndSendDetails(
        suicideRisk.crn,
        res.locals.user.username,
      )
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

    suicideRisk.signedByRo = null
    if (formSentBy !== null) {
      suicideRisk.signedByRo = formSentBy === 'RO'
    } else {
      errorMessages.sentByResponsibleOfficerOrUser = {
        text: 'Please select who is sending this document before leaving this screen',
      }
    }

    suicideRisk.officerEmailAddress = signAndSendDetails.responsibleOfficer?.emailAddress
    suicideRisk.telephoneNumber = signAndSendDetails.responsibleOfficer?.telephoneNumber
    suicideRisk = handleSelectedAddress(suicideRisk, signAndSendDetails.responsibleOfficer, req)

    if (officerEmailAddress != null) {
      suicideRisk.officerEmailAddress = officerEmailAddress
    }

    if (officerTelephoneNumber != null) {
      suicideRisk.telephoneNumber = officerTelephoneNumber
    }

    // perform field validation
    if (officerEmailAddress != null && officerEmailAddress.length > 0) {
      if (!isValidEmail(officerEmailAddress)) {
        errorMessages.email = {
          text: 'Enter an email address in the correct format for Officer Email Address.',
        }
      }

      if (officerEmailAddress.length > 200) {
        errorMessages.email = {
          text: 'Please enter a value that is less than or equal to 200 characters for Officer Email Address.',
        }
      }
    }

    if (officerTelephoneNumber != null && officerTelephoneNumber.length > 0) {
      if (officerTelephoneNumber.length > 35) {
        errorMessages.telephoneNumber = {
          text: 'Please enter a value that is less than or equal to 35 characters for Telephone Number.',
        }
      }
    }

    if (req.body.action === 'addAddress') {
      const hasValidationErrors: boolean = Object.keys(errorMessages).length > 0

      if (hasValidationErrors) {
        const currentUserDisplayName = res.locals.user.displayName
        const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

        const alternateAddressOptions = addressListToSelectItemList(
          signAndSendDetails.responsibleOfficer?.addresses,
          suicideRisk.basicDetailsSaved,
          suicideRisk.workAddress?.addressId,
        )

        let addressNotAvailable: boolean = false
        if (
          suicideRisk.workAddress != null &&
          suicideRisk.workAddress.addressId != null &&
          signAndSendDetails.responsibleOfficer?.addresses != null
        ) {
          const addressPresent = signAndSendDetails.responsibleOfficer.addresses?.find(
            record => record.id === suicideRisk.workAddress.addressId,
          )
          if (addressPresent == null) {
            suicideRisk.workAddress = null
            addressNotAvailable = true
            errorMessages.genericErrorMessage = {
              text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
            }
          }
        }

        let manualAddressAllowed: boolean = false
        if (
          signAndSendDetails.responsibleOfficer.addresses == null ||
          signAndSendDetails.responsibleOfficer.addresses.length === 0
        ) {
          manualAddressAllowed = true
        }

        let defaultAddress: DeliusAddress = null
        let onlyAlternateAddressesAvailable: boolean = false
        if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer?.addresses != null) {
          defaultAddress = signAndSendDetails.responsibleOfficer?.addresses.find(record => record.status === 'Default')

          if (defaultAddress) {
            suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
          } else if (signAndSendDetails.responsibleOfficer.addresses?.length > 0) {
            // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
            // We do not display radio buttons for the user, just a drop-down of the alternate addresses
            onlyAlternateAddressesAvailable = true
          }
        }

        res.render('pages/sign-and-send', {
          suicideRisk,
          currentPage,
          suicideRiskId,
          signAndSendDetails,
          currentUserDisplayName,
          dateOfLetter,
          alternateAddressOptions,
          addressNotAvailable,
          manualAddressAllowed,
          errorMessages,
          onlyAlternateAddressesAvailable,
        })

        return
      }
      // only save if we have no errors
      suicideRisk.signAndSendSaved = true
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/update-work-address/${req.params.id}`)
      return
    }

    if (req.body.action === 'saveProgressAndClose') {
      const hasValidationErrors: boolean = Object.keys(errorMessages).length > 0
      let addressNotAvailable: boolean = false

      if (hasValidationErrors) {
        const currentUserDisplayName = res.locals.user.displayName
        const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

        const alternateAddressOptions = addressListToSelectItemList(
          signAndSendDetails.responsibleOfficer?.addresses,
          suicideRisk.basicDetailsSaved,
          suicideRisk.workAddress?.addressId,
        )

        if (
          suicideRisk.workAddress != null &&
          suicideRisk.workAddress.addressId != null &&
          signAndSendDetails.responsibleOfficer?.addresses != null
        ) {
          const addressPresent = signAndSendDetails.responsibleOfficer?.addresses.find(
            record => record.id === suicideRisk.workAddress.addressId,
          )
          if (addressPresent == null) {
            suicideRisk.workAddress = null
            addressNotAvailable = true

            errorMessages.genericErrorMessage = {
              text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
            }
          }
        }

        let manualAddressAllowed: boolean = false
        if (
          signAndSendDetails.responsibleOfficer.addresses == null ||
          signAndSendDetails.responsibleOfficer.addresses?.length === 0
        ) {
          manualAddressAllowed = true
        }

        let defaultAddress: DeliusAddress = null
        let onlyAlternateAddressesAvailable: boolean = false
        if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer.addresses != null) {
          defaultAddress = signAndSendDetails.responsibleOfficer?.addresses?.find(record => record.status === 'Default')

          if (defaultAddress) {
            suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
          } else if (signAndSendDetails.responsibleOfficer.addresses?.length > 0) {
            // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
            // We do not display radio buttons for the user, just a drop-down of the alternate addresses
            onlyAlternateAddressesAvailable = true
          }
        }

        res.render('pages/sign-and-send', {
          suicideRisk,
          currentPage,
          suicideRiskId,
          signAndSendDetails,
          currentUserDisplayName,
          dateOfLetter,
          alternateAddressOptions,
          addressNotAvailable,
          manualAddressAllowed,
          errorMessages,
          onlyAlternateAddressesAvailable,
        })

        return
      }
      suicideRisk.signAndSendSaved = true
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)

      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'clear-signature') {
      const hasValidationErrors: boolean = Object.keys(errorMessages).length > 0
      if (hasValidationErrors) {
        const currentUserDisplayName = res.locals.user.displayName
        const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

        const alternateAddressOptions = addressListToSelectItemList(
          signAndSendDetails.responsibleOfficer?.addresses,
          suicideRisk.basicDetailsSaved,
          suicideRisk.workAddress?.addressId,
        )

        let addressNotAvailable: boolean = false
        if (
          suicideRisk.workAddress != null &&
          suicideRisk.workAddress.addressId != null &&
          signAndSendDetails.responsibleOfficer?.addresses != null
        ) {
          const addressPresent = signAndSendDetails.responsibleOfficer?.addresses?.find(
            record => record.id === suicideRisk.workAddress.addressId,
          )
          if (addressPresent == null) {
            suicideRisk.workAddress = null
            addressNotAvailable = true

            errorMessages.genericErrorMessage = {
              text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
            }
          }
        }

        let manualAddressAllowed: boolean = false
        if (
          signAndSendDetails.responsibleOfficer?.addresses == null ||
          signAndSendDetails.responsibleOfficer?.addresses.length === 0
        ) {
          manualAddressAllowed = true
        }

        let defaultAddress: DeliusAddress = null
        let onlyAlternateAddressesAvailable: boolean = false
        if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer?.addresses != null) {
          defaultAddress = signAndSendDetails.responsibleOfficer?.addresses?.find(record => record.status === 'Default')

          if (defaultAddress) {
            suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
          } else if (signAndSendDetails.responsibleOfficer?.addresses?.length > 0) {
            // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
            // We do not display radio buttons for the user, just a drop-down of the alternate addresses
            onlyAlternateAddressesAvailable = true
          }
        }

        res.render('pages/sign-and-send', {
          suicideRisk,
          currentPage,
          suicideRiskId,
          signAndSendDetails,
          currentUserDisplayName,
          dateOfLetter,
          alternateAddressOptions,
          addressNotAvailable,
          manualAddressAllowed,
          errorMessages,
          onlyAlternateAddressesAvailable,
        })

        return
      }

      suicideRisk.signAndSendSaved = true
      suicideRisk.signature = null
      suicideRisk.sheetSentBy = null
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else if (req.body.action === 'sign') {
      const hasValidationErrors: boolean = Object.keys(errorMessages).length > 0
      if (hasValidationErrors) {
        const currentUserDisplayName = res.locals.user.displayName
        const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)

        const alternateAddressOptions = addressListToSelectItemList(
          signAndSendDetails.responsibleOfficer?.addresses,
          suicideRisk.basicDetailsSaved,
          suicideRisk.workAddress?.addressId,
        )

        let addressNotAvailable: boolean = false
        if (
          suicideRisk.workAddress != null &&
          suicideRisk.workAddress.addressId != null &&
          signAndSendDetails.responsibleOfficer?.addresses != null
        ) {
          const addressPresent = signAndSendDetails.responsibleOfficer?.addresses.find(
            record => record.id === suicideRisk.workAddress.addressId,
          )
          if (addressPresent == null) {
            suicideRisk.workAddress = null
            addressNotAvailable = true

            errorMessages.genericErrorMessage = {
              text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
            }
          }
        }

        let manualAddressAllowed: boolean = false
        if (
          signAndSendDetails.responsibleOfficer?.addresses == null ||
          signAndSendDetails.responsibleOfficer?.addresses.length === 0
        ) {
          manualAddressAllowed = true
        }

        let defaultAddress: DeliusAddress = null
        let onlyAlternateAddressesAvailable: boolean = false
        if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer?.addresses != null) {
          defaultAddress = signAndSendDetails.responsibleOfficer?.addresses.find(record => record.status === 'Default')

          if (defaultAddress) {
            suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
          } else if (signAndSendDetails.responsibleOfficer?.addresses?.length > 0) {
            // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
            // We do not display radio buttons for the user, just a drop-down of the alternate addresses
            onlyAlternateAddressesAvailable = true
          }
        }
        res.render('pages/sign-and-send', {
          suicideRisk,
          currentPage,
          suicideRiskId,
          signAndSendDetails,
          currentUserDisplayName,
          dateOfLetter,
          alternateAddressOptions,
          addressNotAvailable,
          manualAddressAllowed,
          errorMessages,
          onlyAlternateAddressesAvailable,
        })

        return
      }

      suicideRisk.signAndSendSaved = true
      suicideRisk.signature = createSignatureString(signAndSendDetails.userDetails, formSentBy)
      suicideRisk.sheetSentBy = getOfficerString(signAndSendDetails.responsibleOfficer)
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else if (req.body.action === 'refreshFromNdelius') {
      res.redirect(`/sign-and-send/${req.params.id}`)
    } else {
      // save and continue
      const hasValidationErrors: boolean = Object.keys(errorMessages).length > 0
      if (hasValidationErrors) {
        const currentUserDisplayName = res.locals.user.displayName
        const dateOfLetter: string = toUserDate(suicideRisk.dateOfLetter)
        let addressNotAvailable: boolean = false

        const alternateAddressOptions = addressListToSelectItemList(
          signAndSendDetails.responsibleOfficer?.addresses,
          suicideRisk.basicDetailsSaved,
          suicideRisk.workAddress?.addressId,
        )

        const addressPresent = signAndSendDetails.responsibleOfficer?.addresses?.find(
          record => record.id === suicideRisk.workAddress?.addressId,
        )

        if (addressPresent == null) {
          suicideRisk.workAddress = null
          addressNotAvailable = true
          errorMessages.genericErrorMessage = {
            text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
          }
        }

        let manualAddressAllowed: boolean = false
        if (
          signAndSendDetails.responsibleOfficer?.addresses == null ||
          signAndSendDetails.responsibleOfficer?.addresses?.length === 0
        ) {
          manualAddressAllowed = true
        }

        let defaultAddress: DeliusAddress = null
        let onlyAlternateAddressesAvailable: boolean = false
        if (suicideRisk.workAddress == null && signAndSendDetails.responsibleOfficer?.addresses != null) {
          defaultAddress = signAndSendDetails.responsibleOfficer?.addresses?.find(record => record.status === 'Default')

          if (defaultAddress) {
            suicideRisk.workAddress = toSuicideRiskAddress(defaultAddress)
          } else if (signAndSendDetails.responsibleOfficer?.addresses?.length > 0) {
            // Scenario when a default address is not found from integration api but other (non-default) alternate addresses are found
            // We do not display radio buttons for the user, just a drop-down of the alternate addresses
            onlyAlternateAddressesAvailable = true
          }
        }
        res.render('pages/sign-and-send', {
          suicideRisk,
          currentPage,
          suicideRiskId,
          signAndSendDetails,
          currentUserDisplayName,
          dateOfLetter,
          alternateAddressOptions,
          addressNotAvailable,
          manualAddressAllowed,
          errorMessages,
          onlyAlternateAddressesAvailable,
        })

        return
      }
      suicideRisk.signAndSendSaved = true
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      res.redirect(`/check-your-answers/${req.params.id}`)
    }
  })

  function handleSelectedAddress(suicideRisk: SuicideRisk, userDetails: PersonDetails, req: Request): SuicideRisk {
    const risk = suicideRisk
    const selectedAddress = getSelectedAddress(userDetails.addresses, req.body.alternateAddress)
    if (selectedAddress) {
      risk.workAddress = toSuicideRiskAddress(selectedAddress)
    }
    return risk
  }

  function createSignatureString(currentUserDetails: UserDetails, formSentBy: string): string {
    let signature: string = ''
    if (currentUserDetails != null) {
      signature += currentUserDetails.forename
      if (currentUserDetails.middleName != null) {
        signature += ` ${currentUserDetails.middleName}`
      }
      signature += ` ${currentUserDetails.surname} ${toFullUserDate(new Date().toISOString())}`
    }

    if (formSentBy === 'RO') {
      signature += ` (Responsible Officer)`
    }

    if (formSentBy === 'USER') {
      signature += ` (User on behalf of the Responsible Officer)`
    }

    return signature
  }

  function getOfficerString(responsibleOfficerDetails: ResponsibleOfficerDetails): string {
    let officerNameForDisplay: string = ''
    if (responsibleOfficerDetails != null) {
      officerNameForDisplay += responsibleOfficerDetails.name.forename
      if (responsibleOfficerDetails.name.middleName != null) {
        officerNameForDisplay += ` ${responsibleOfficerDetails.name.middleName}`
      }
      officerNameForDisplay += ` ${responsibleOfficerDetails.name.surname}`
    }
    return officerNameForDisplay
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
    if (addressIdentifier && addressIdentifier.length > 0) {
      const addressIdentifierNumber: number = +addressIdentifier
      if (addressList && Object.keys(addressList).length > 0) {
        return addressList.find(address => address.id === addressIdentifierNumber)
      }

      return null
    }
    return null
  }

  function isValidEmail(email: string): boolean {
    if (!email) return false
    const trimmed = email.trim().toLowerCase()
    // exactly one @, no spaces, text before and after the @ required
    return /^[^@\s]+@[^@\s]+$/.test(trimmed)
  }

  return router
}
