import { addDays, addHours, endOfDay, getHours, getTime, isAfter, set, startOfDay } from 'date-fns'

interface TimeRange {
  start: number
  end: number
}

export function generateRange(day: number, date = new Date()) {
  return [startOfDay(addDays(date, 1 - day)), endOfDay(date)] as [Date, Date]
}

export function splitByDay<T extends TimeRange>(list: T[], range: [Date, Date]) {
  return list.flatMap((data) => {
    const { start, end } = data
    const [startDate, endDate] = range
    let _start = isAfter(start, startDate) ? new Date(start) : startDate
    const timeList: Array<number> = [_start.getTime()]
    _start = startOfDay(addDays(_start, 1))
    while (isAfter(end, _start)) {
      timeList.push(_start.getTime())
      _start = addDays(_start, 1)
    }

    timeList.push(isAfter(endDate, end) ? end : endDate.getTime())
    const result: T[] = []
    for (let i = 0; i < timeList.length - 1; i++) {
      result.push({
        ...data,
        start: timeList[i],
        end: timeList[i + 1],
      })
    }
    return result
  })
}

export function splitByHour<T extends TimeRange>(list: T[]) {
  return list.flatMap((data) => {
    const { start, end } = data
    const startHour = getHours(start)
    let current = getTime(set(start, {
      hours: startHour + 1,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }))
    const timeList: Array<number> = [start]
    while (current < end) {
      timeList.push(current)
      current = getTime(addHours(current, 1))
    }
    timeList.push(end)
    const result: T[] = []
    for (let i = 0; i < timeList.length - 1; i++) {
      result.push({
        ...data,
        start: timeList[i],
        end: timeList[i + 1],
      })
    }
    return result
  })
}

export function calcTotalTime(list: Array<TimeRange>) {
  return list.reduce((acc, cur) => acc += (cur.end - cur.start), 0)
}

export function complement(num: number) {
  return num < 10 ? `0${num}` : `${num}`
}

export function extractTime(time: number) {
  const milli = (time % 1000)
  time = ~~(time / 1000)
  const second = time % 60
  time = ~~(time / 60)
  const minute = time % 60
  const hour = ~~(time / 60)
  return {
    raw: {
      milli,
      second,
      minute,
      hour,
    },
    complement: {
      milli: complement(~~(milli / 10)),
      second: complement(second),
      minute: complement(minute),
      hour: complement(hour),
    },
  }
}

export function calcDuration(count: number, span: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month') {
  const second = 1000 * count
  switch (span) {
    case 'second':
      return second
    case 'minute':
      return second * 60
    case 'hour':
      return second * 60 * 60
    case 'day':
      return second * 60 * 60 * 24
    case 'week':
      return second * 60 * 60 * 24 * 7
    case 'month':
      return second * 60 * 60 * 24 * 30
  }
}
