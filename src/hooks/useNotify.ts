import type { NotificationSchema } from '@/plugins/notiwind'
import { notify } from '@/plugins/notiwind'
import { i18n } from '@/locales'

type Notify = typeof notify

type NewNotifyArgs<T> = T extends [infer U, ...infer V]
  ? U extends NotificationSchema
    ? [Omit<U, 'type' | 'group'>, ...V]
    : never
  : never

type NewNotify = (...args: NewNotifyArgs<Parameters<Notify>>) => ReturnType<Notify>

export function useNotify() {
  const success: NewNotify = (notification, ...args) => notify({
    type: 'success',
    title: i18n.global.t('notiwind.success'),
    ...notification,
  }, ...args)

  const info: NewNotify = (notification, ...args) => notify({
    type: 'info',
    title: i18n.global.t('notiwind.info'),
    ...notification,
  }, ...args)

  const error: NewNotify = (notification, ...args) => notify({
    type: 'error',
    title: i18n.global.t('notiwind.error'),
    ...notification,
  }, ...args)

  const warning: NewNotify = (notification, ...args) => notify({
    type: 'warning',
    title: i18n.global.t('notiwind.warning'),
    ...notification,
  }, ...args)

  return {
    success,
    info,
    error,
    warning,
  }
}
