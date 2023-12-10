import { addDays, endOfDay, isAfter, isSameDay, startOfDay, startOfHour } from 'date-fns'

interface TimeRange {
  start: number
  end: number
}

export function generateRange(day: number) {
  return [startOfDay(addDays(new Date(), 1 - day)), endOfDay(new Date())] as [Date, Date]
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
    const startHour = new Date(start).getHours()
    const endHour = isSameDay(start, end) ? new Date(end).getHours() : 23
    const timeList: Array<number> = [start]
    for (let i = startHour + 1; i <= endHour; i++) {
      const date = startOfHour(new Date(start).setHours(i))
      const time = date.getTime()
      if (time > end)
        break

      else
        timeList.push(time)
    }
    timeList.push(isSameDay(start, end) ? end : new Date(startOfDay(addDays(start, 1))).getTime())
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

function complement(num: number) {
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
