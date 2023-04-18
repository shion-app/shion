export interface Plan {
  id: number
  name: string
  totalTime: number
}

export type CreatePlan = Pick<Plan, 'name'>
