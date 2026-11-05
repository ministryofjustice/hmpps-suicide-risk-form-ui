export interface SelectItem {
  value: string | null | undefined
  text: string | null | undefined
  selected: boolean | null | undefined
}

export interface RadioButton {
  value: string
  text: string
  checked: boolean
}

export interface ErrorMessages {
  [key: string]: { text: string }
}
