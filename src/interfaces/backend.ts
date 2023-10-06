export interface Program {
  path: string
  name: string
  icon: number[]
}

export interface Activity {
  path: string
}

export interface AudioActivity extends Activity {
  state: 'Active' | 'Inactive' | 'Expired'
}
