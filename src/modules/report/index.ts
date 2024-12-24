import { db } from '../database'
import type { SelectDomain, SelectLabel, SelectPlan, SelectProgram } from '../database'

export interface Report {
  orderProgramList: Array<SelectProgram>
  orderPlanList: Array<SelectPlan>
  orderLabelList: Array<SelectLabel>
  orderDomainList: Array<SelectDomain>
  programTotalTime: number
  planTotalTime: number
  labelTotalTime: number
  domainTotalCount: number
  // successiveActivity: Record<number, Segment>
  // successiveNote: Record<number, Segment>
}

// interface Range {
//   start: number
//   end: number
// }

// interface Segment {
//   max: number
//   end: number
// }

// function getDifferenceInDays(later: number, earlier: number) {
//   return differenceInDays(startOfDay(later), startOfDay(earlier))
// }

// function findSuccessiveSegment<T extends Range>(list: Array<T>) {
//   let max = 0
//   let start = 0
//   let end = 0
//   const dayList = list.flatMap(({ start, end }) => [start, end]).sort()
//   for (let i = 1; i < dayList.length; i++) {
//     const sameOrNear = getDifferenceInDays(dayList[i], dayList[i - 1]) < 2
//     if (sameOrNear) {
//       if (start == 0)
//         start = dayList[i - 1]

//       const span = differenceInDays(startOfDay(dayList[i]), startOfDay(start)) + 1
//       if (span > max) {
//         max = span
//         end = dayList[i]
//       }
//     }
//     else {
//       start = 0
//     }
//   }
//   return {
//     max,
//     end,
//   }
// }

export async function generate(start: number, end: number, limit: number) {
  const [programList, planList, labelList, domainList, programTotalTime, planTotalTime, labelTotalTime, domainTotalCount] = await Promise.all([
    db.program.select({
      start,
      end,
      orderByTotalTime: true,
      limit,
    }),
    db.plan.select({
      start,
      end,
      orderByTotalTime: true,
      limit,
    }),
    db.label.select({
      start,
      end,
      orderByTotalTime: true,
      limit,
    }),
    db.domain.select({
      start,
      end,
      orderByCount: true,
      limit,
    }),
    db.program.select({
      start,
      end,
      onlyTotalTime: true,
    }),
    db.plan.select({
      start,
      end,
      onlyTotalTime: true,
    }),
    db.label.select({
      start,
      end,
      onlyTotalTime: true,
    }),
    db.domain.select({
      start,
      end,
      onlyCount: true,
    }),
  ])

  // const activityGroupMap = Object.fromEntries(Object.entries(groupBy(activityList, 'programId')).map(([id, list]) => [id, findSuccessiveSegment(list)]))
  // const noteGroupMap = Object.fromEntries(Object.entries(groupBy(noteList, 'labelId')).map(([id, list]) => [id, findSuccessiveSegment(list)]))

  const data: Report = {
    orderProgramList: programList,
    orderPlanList: planList,
    orderLabelList: labelList,
    orderDomainList: domainList,
    // successiveNote: noteGroupMap,
    // successiveActivity: activityGroupMap,
    programTotalTime: programTotalTime.reduce((acc, cur) => acc += cur.totalTime, 0),
    planTotalTime: planTotalTime.reduce((acc, cur) => acc += cur.totalTime, 0),
    labelTotalTime: labelTotalTime.reduce((acc, cur) => acc += cur.totalTime, 0),
    domainTotalCount: domainTotalCount.reduce((acc, cur) => acc += cur.itemCount, 0),
  }

  return data
}
