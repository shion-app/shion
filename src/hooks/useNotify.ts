import type { NotificationSchema } from '@/plugins/notiwind'
import { notify } from '@/plugins/notiwind'

type Notify = typeof notify

type NewNotifyArgs<T> = T extends [infer U, ...infer V]
  ? U extends NotificationSchema
    ? [Omit<U, 'type' | 'group'>, ...V]
    : never
  : never

type NewNotify = (...args: NewNotifyArgs<Parameters<Notify>>) => ReturnType<Notify>

export function useNotify() {
  const { t } = useI18n()
  const success: NewNotify = (notification, ...args) => notify({
    type: 'success',
    title: t('notiwind.success'),
    ...notification,
  }, ...args)

  const info: NewNotify = (notification, ...args) => notify({
    type: 'info',
    title: t('notiwind.info'),
    ...notification,
  }, ...args)

  const error: NewNotify = (notification, ...args) => notify({
    type: 'error',
    title: t('notiwind.error'),
    ...notification,
  }, ...args)

  const warning: NewNotify = (notification, ...args) => notify({
    type: 'warning',
    title: t('notiwind.warning'),
    ...notification,
  }, ...args)

  return {
    success,
    info,
    error,
    warning,
  }
}
