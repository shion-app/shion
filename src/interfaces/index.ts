import type { DefineComponent } from 'vue'

export type Replace<T, U extends { [K in keyof T]?: unknown }> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

export interface TimeLineNode {
  start: number
  end: number
  name: string
  color: string
  children?: TimeLineNode[]
}

export type ComponentInstance<T> = T extends new (...args: any[]) => infer R
  ? R
  : T extends (...args: any[]) => infer R
    ? R extends { __ctx?: infer K }
      ? Exclude<K, void> extends { expose: (...args: infer K) => void }
        ? K[0] & InstanceType<DefineComponent>
        : any
      : any
    : any

export * from '@/components/modal/types'
