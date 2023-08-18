export interface Program {
  path: string
  description: string
  icon: number[]
}

export interface Activity {
  path: string
}

export interface AudioActivity {
  state: 'Active' | 'Inactive' | 'Expired'
  path: string
}
