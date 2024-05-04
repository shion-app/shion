export interface CalendarMonthType {
  year: number
  month: number
}

export interface StatusAdapter {
  color: string
  text: string
}

export type ActiveStatusMap = Map<string, StatusAdapter>
