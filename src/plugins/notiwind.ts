import {
  NotificationGroup,
  createNotifier,
  defineNotificationComponent,
} from 'notiwind'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NotificationSchema = {
  type: 'success' | 'info' | 'warning' | 'error'
  title?: string
  text?: string
}

export const notify = createNotifier<NotificationSchema>()
export const Notification = defineNotificationComponent<NotificationSchema>()
export { NotificationGroup }
