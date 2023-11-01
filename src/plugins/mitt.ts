import mitt from 'mitt'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Events = {
  'toggle-more-menu': boolean
}

export const emitter = mitt<Events>()
