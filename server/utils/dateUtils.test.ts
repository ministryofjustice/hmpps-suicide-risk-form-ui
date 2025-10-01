import { calculateAge } from './dateUtils'

describe('calculateAge', () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentDay = new Date().getDate()

  it.each([
    [
      '30 Years old',
      `${currentYear - 30}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      '30',
    ],
    ['Empty string', '', ''],
    ['Whitespace', '   ', ''],
  ])('%s', (_: string, dobString: string, expected: string) => {
    expect(calculateAge(dobString)).toEqual(expected)
  })
})
