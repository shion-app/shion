import mitt from 'mitt'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Events = {
  'toggle-more-menu': {
    id: string
    show: boolean
  }
  'page-refresh': void
}

export const emitter = mitt<Events>()
