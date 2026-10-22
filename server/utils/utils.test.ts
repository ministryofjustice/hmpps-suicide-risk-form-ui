import { convertToTitleCase, findDefaultAddressInAddressList, initialiseName } from './utils'

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
  ])('%s convertToTitleCase(%s, %s)', (_: string | null, a: string | null, expected: string) => {
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
  ])('%s initialiseName(%s, %s)', (_: string | null, a: string | null, expected: string | null) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('findDefaultAddressInAddressList', () => {
  const addr = (id: number, status: string, startDate: string) =>
    ({ id, status, startDate }) as unknown as Parameters<typeof findDefaultAddressInAddressList>[0][number]

  it('returns latest postal address', () => {
    const list = [addr(1, 'Postal', '2020-01-01'), addr(2, 'Postal', '2024-01-01'), addr(3, 'Main', '2025-01-01')]
    expect(findDefaultAddressInAddressList(list).id).toBe(2)
  })
  it('falls back to latest main address', () => {
    const list = [addr(1, 'Main', '2020-01-01'), addr(2, 'Main', '2024-01-01'), addr(3, 'Other', '2025-01-01')]
    expect(findDefaultAddressInAddressList(list).id).toBe(2)
  })
  it('returns null when neither exists or list empty', () => {
    expect(findDefaultAddressInAddressList([addr(1, 'Other', '2020-01-01')])).toBeNull()
    expect(findDefaultAddressInAddressList([])).toBeNull()
    expect(findDefaultAddressInAddressList(null)).toBeNull()
  })
})
