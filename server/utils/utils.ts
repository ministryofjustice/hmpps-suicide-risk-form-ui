import { ErrorMessages, SelectItem } from '../data/uiModels'
import { DeliusAddress, Name } from '../data/ndeliusIntegrationApiClient'
import { SuicideRiskAddress } from '../data/suicideRiskApiClient'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export function handleIntegrationErrors(status: number, message: string, integrationService: string): ErrorMessages {
  const errorMessages: ErrorMessages = {}
  if (status === 400) {
    if (message?.includes('No home area found')) {
      errorMessages.genericErrorMessage = {
        text: 'Your Delius account is missing a home area, please contact the service desk to update your account before using this service.',
      }
    } else {
      errorMessages.genericErrorMessage = {
        text: 'An unexpected 400 type error has occurred. Please contact the service desk and report this error.',
      }
    }
    return errorMessages
  }
  if (status === 404) {
    errorMessages.genericErrorMessage = {
      text: 'The document has not been found or has been deleted. An error has been logged. 404',
    }
    return errorMessages
  }
  if (integrationService === 'NDelius Integration') {
    errorMessages.genericErrorMessage = {
      text: 'There has been a problem fetching information from NDelius. Please try again later.',
    }
  } else if (integrationService === 'Probation offender search') {
    errorMessages.genericErrorMessage = {
      text: 'There has been a problem fetching information from Probation offender search. Please try again later.',
    }

  } else {
    errorMessages.genericErrorMessage = {
      text: 'There has been a problem fetching information from the Suicide Risk Service. Please try again later.',
    }
  }

  return errorMessages
}

export function findDefaultAddressInAddressList(addressList: Array<DeliusAddress>): DeliusAddress {
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

export function toIsoDateFormat(dateStr: string): string {
  if (dateStr && dateStr.trim().length > 0) {
    const [day, month, year] = dateStr.split('/').map(Number)
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return ''
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return ''
}

export function toDayMonthYearDateFormat(dateStr: string): string {
  if (dateStr && dateStr.trim().length > 0) {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return ''
    }
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }
  return ''
}

export function formatTitleAndFullName(title: string, name: Name): string {
  return [title, name.forename, name.middleName, name.surname].filter(Boolean).join(' ')
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

export function toSuicideRiskAddress(deliusAddress: DeliusAddress): SuicideRiskAddress {
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

export function formatAddressForSelectMenuDisplay(deliusAddress: DeliusAddress): string {
  if (deliusAddress) {
    return [
      deliusAddress.officeDescription,
      deliusAddress.buildingName,
      [deliusAddress.buildingNumber, deliusAddress.streetName]
        .filter(item => item)
        .join(' ')
        .trim(),
      deliusAddress.district,
      deliusAddress.townCity,
      deliusAddress.county,
      deliusAddress.postcode,
    ]
      .filter(item => item)
      .join(', ')
  }
  return null
}

export function arrangeSelectItemListAlphabetically(selectItemsToSort: SelectItem[]): SelectItem[] {
  if (selectItemsToSort) {
    return selectItemsToSort.sort((a, b) => a?.text.localeCompare(b?.text, 'en', { numeric: true }))
  }
  return selectItemsToSort
}

export function removeDeliusAddressFromDeliusAddressList(
  deliusAddressList: DeliusAddress[],
  defaultAddress: DeliusAddress,
): DeliusAddress[] {
  if (defaultAddress && deliusAddressList) {
    return deliusAddressList.filter(obj => obj.id !== defaultAddress.id)
  }
  return deliusAddressList
}
