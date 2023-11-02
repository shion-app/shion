import mitt from 'mitt'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Events = {
  'toggle-more-menu': {
    id: string
    show: boolean
  }
}

export const emitter = mitt<Events>()
