export type Replace<T, U extends { [K in keyof T]?: unknown }> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

export * from '@/components/modal/types'
