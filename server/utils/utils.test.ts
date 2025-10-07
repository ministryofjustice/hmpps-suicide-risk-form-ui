import {
  convertToTitleCase,
  findDefaultAddressInAddressList,
  formatTitleAndFullName,
  handleIntegrationErrors,
  initialiseName,
  toIsoDateFormat,
  toSuicideRiskAddress,
} from './utils'
import { ErrorMessages } from '../data/uiModels'
import { DeliusAddress, Name } from '../data/ndeliusIntegrationApiClient'
import { SuicideRiskAddress } from '../data/suicideRiskApiClient'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('initialise error messages', () => {
  it.each([
    [
      'No Home Area Case',
      400,
      'No home area found',
      'Suicide risk',
      'Your Delius account is missing a home area, please contact the service desk to update your account before using this service.',
    ],
    [
      '400 Error Case',
      400,
      'Generic 400 error',
      'Suicide risk',
      'An unexpected 400 type error has occurred. Please contact the service desk and report this error.',
    ],
    [
      '404 Not Found Case',
      404,
      'Not found',
      'Suicide risk',
      'The document has not been found or has been deleted. An error has been logged. 404',
    ],
    [
      '404 Not Found Case',
      500,
      'Not found',
      'NDelius Integration',
      'There has been a problem fetching information from NDelius. Please try again later.',
    ],
    [
      'Unknown Error case',
      999,
      'Error',
      'Suicide risk',
      'There has been a problem fetching information from the Suicide Risk Service. Please try again later.',
    ],
  ])(
    '%s handleIntegrationErrors(%s, %s, %s)',
    (_: string, status: number, message: string, service: string, expected: string) => {
      const result: ErrorMessages = handleIntegrationErrors(status, message, service)
      expect(result.genericErrorMessage.text).toEqual(expected)
    },
  )
})

describe('findDefaultAddressInAddressList', () => {
  const baseAddress = {
    id: 1,
    buildingName: 'Test Building',
    buildingNumber: '1',
    streetName: 'Test Street',
    townCity: 'Test Town',
    district: 'Test District',
    county: 'Test County',
    postcode: 'TE5 2ST',
  }

  it.each([
    ['null input', null, null],
    ['empty array', [], null],
    [
      'Postal takes priority over Main (latest startDate)',
      [
        { ...baseAddress, id: 1, status: 'Postal', startDate: '2025-03-01' },
        { ...baseAddress, id: 2, status: 'Postal', startDate: '2025-09-20' },
        { ...baseAddress, id: 3, status: 'Main', startDate: '2025-07-10' },
      ],
      { ...baseAddress, id: 2, status: 'Postal', startDate: '2025-09-20' },
    ],
    [
      'No Postal so Main is selected (latest startDate)',
      [
        { ...baseAddress, id: 1, status: 'Main', startDate: '2025-03-01' },
        { ...baseAddress, id: 2, status: 'Main', startDate: '2025-08-25' },
      ],
      { ...baseAddress, id: 2, status: 'Main', startDate: '2025-08-25' },
    ],
    [
      'No Postal or Main so expect null',
      [
        { ...baseAddress, id: 1, status: 'Previous', startDate: '2025-02-01' },
        { ...baseAddress, id: 2, status: 'Other', startDate: '2025-04-01' },
      ],
      null,
    ],
  ])('%s', (_: string, input: DeliusAddress[], expected: DeliusAddress) => {
    expect(findDefaultAddressInAddressList(input)).toEqual(expected)
  })
})

describe('toIsoDateFormat', () => {
  it.each([
    ['Valid date', '01/01/2025', '2025-01-01'],
    ['Valid date no leading zero', '9/2/2024', '2024-02-09'],
    ['Valid input with leading/trailing spaces', ' 01/02/2025 ', '2025-02-01'],
    ['Empty string', '', ''],
    ['Whitespace only', '   ', ''],
    ['Null string', null, ''],
    ['Non-numeric values', 'dd/mm/yyyy', ''],
  ])('%s', (_: string, input: string, expected: string) => {
    expect(toIsoDateFormat(input)).toEqual(expected)
  })
})

describe('formatTitleAndFullName', () => {
  it.each([
    ['All parts present', 'Mr', { forename: 'John', middleName: 'Middle', surname: 'Doe' }, 'Mr John Middle Doe'],
    ['Missing middle name', 'Mrs', { forename: 'Jane', surname: 'Doe' }, 'Mrs Jane Doe'],
    ['Missing forename and middle name', 'Mr', { surname: 'Doe' }, 'Mr Doe'],
    ['Missing surname', 'Mrs', { forename: 'Jane', middleName: 'Middle' }, 'Mrs Jane Middle'],
    ['All name fields missing', 'Mr', {}, 'Mr'],
    ['Empty title', '', { forename: 'Jane', middleName: 'Middle', surname: 'Doe' }, 'Jane Middle Doe'],
    ['Title and forename only', 'Dr', { forename: 'John' }, 'Dr John'],
  ])('%s', (_: string, title: string, name: Name, expected: string) => {
    expect(formatTitleAndFullName(title, name)).toEqual(expected)
  })
})

describe('toSuicideRiskAddress', () => {
  const input: DeliusAddress = {
    id: 42,
    status: 'Postal',
    officeDescription: 'Test Office',
    buildingName: 'Test Building',
    buildingNumber: '1',
    streetName: 'Test Street',
    townCity: 'Test City',
    district: 'Test District',
    county: 'Test County',
    postcode: 'TE5 2ST',
    startDate: '2025-02-15'
  }

  it.each([
    [
      'Maps valid Delius Address correctly',
      input,
      {
        addressId: 42,
        status: 'Postal',
        officeDescription: 'Test Office',
        buildingName: 'Test Building',
        buildingNumber: '1',
        streetName: 'Test Street',
        townCity: 'Test City',
        district: 'Test District',
        county: 'Test County',
        postcode: 'TE5 2ST',
      },
    ],
    ['Returns null if input is null', null, null],
  ])('%s', (_: string, deliusAddress: DeliusAddress, expected: SuicideRiskAddress) => {
    expect(toSuicideRiskAddress(deliusAddress)).toEqual(expected)
  })
})
