import { differenceInDays, startOfDay } from 'date-fns'
import { groupBy } from 'lodash-es'

import { db } from '../database'
import type { SelectDomain, SelectLabel, SelectProgram } from '../database'

export interface Report {
  orderProgramList: Array<SelectProgram>
  orderLabelList: Array<SelectLabel>
  orderDomainList: Array<SelectDomain>
  successiveActivity: Record<number, Segment>
  successiveNote: Record<number, Segment>
}

interface Range {
  start: number
  end: number
}

interface Segment {
  max: number
  end: number
}

function getDifferenceInDays(later: number, earlier: number) {
  return differenceInDays(startOfDay(later), startOfDay(earlier))
}

function findSuccessiveSegment<T extends Range>(list: Array<T>) {
  let max = 0
  let start = 0
  let end = 0
  const dayList = list.flatMap(({ start, end }) => [start, end]).sort()
  for (let i = 1; i < dayList.length; i++) {
    const sameOrNear = getDifferenceInDays(dayList[i], dayList[i - 1]) < 2
    if (sameOrNear) {
      if (start == 0)
        start = dayList[i - 1]

      const span = differenceInDays(startOfDay(dayList[i]), startOfDay(start)) + 1
      if (span > max) {
        max = span
        end = dayList[i]
      }
    }
    else {
      start = 0
    }
  }
  return {
    max,
    end,
  }
}

export async function generate(start: number, end: number) {
  const [programList, labelList, domainList, activityList, noteList] = await Promise.all([
    db.program.select({
      start,
      end,
      orderByTotalTime: true,
      limit: 20,
    }),
    db.label.select({
      start,
      end,
      orderByTotalTime: true,
      limit: 20,
    }),
    db.domain.select({
      start,
      end,
      orderByCount: true,
      limit: 20,
    }),
    db.activity.select({
      start,
      end,
    }),
    db.note.select({
      start,
      end,
    }),
  ])

  const activityGroupMap = Object.fromEntries(Object.entries(groupBy(activityList, 'programId')).map(([id, list]) => [id, findSuccessiveSegment(list)]))
  const noteGroupMap = Object.fromEntries(Object.entries(groupBy(noteList, 'labelId')).map(([id, list]) => [id, findSuccessiveSegment(list)]))

  const data: Report = {
    orderProgramList: programList,
    orderLabelList: labelList,
    orderDomainList: domainList,
    successiveNote: noteGroupMap,
    successiveActivity: activityGroupMap,
  }

  return data
}
