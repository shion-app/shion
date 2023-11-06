import mitt from 'mitt'

import type { useFormModalOptions } from '@/hooks/useFormModal'
import { db } from '@/modules/database'
import type { InsertNote, SelectLabel, SelectPlan } from '@/modules/database'

export function useNoteCreate() {
  const { t } = useI18n()
  const { parseFieldsError } = useDatabase()
  const { start } = useTimerStore()

  const planList = ref<Array<SelectPlan>>([])
  const labelList = ref<Array<SelectLabel>>([])

  const formvalues = ref<{
    planId?: number
    labelId?: number
  }>({
    planId: undefined,
    labelId: undefined,
  })

  const emitter = mitt()

  const { open, close } = useFormModal(
    computed<useFormModalOptions>(() => {
      return {
        attrs: {
          title: t('note.fill.title'),
          form: {
            fields: [
              {
                type: 'select',
                key: 'planId',
                label: t('note.fill.plan'),
                props: {
                  'items': planList.value.map(({ name, id }) => ({
                    title: name,
                    value: id,
                  })),
                  'onUpdate:modelValue': (v) => {
                    formvalues.value = {
                      planId: v,
                      labelId: undefined,
                    }
                  },
                },
              },
              {
                type: 'select',
                key: 'labelId',
                label: t('note.fill.label'),
                props: {
                  items: labelList.value.filter(i => i.planId == formvalues.value.planId).map(({ name, id }) => ({
                    title: name,
                    value: id,
                  })),
                },
              },
            ],
            values: formvalues.value,
          },
          schema: z => z.object({
            planId: z.number(),
            labelId: z.number(),
          }),
          async onConfirm(v, setErrors) {
            let noteId = 0
            try {
              const data = await handleCreate(v)
              noteId = data.lastInsertId
            }
            catch (error) {
              return setErrors(parseFieldsError(error))
            }
            close()
            start(() => db.note.update(noteId, {
              end: Date.now(),
            }))
            emitter.emit('confirm')
          },
          onClosed() {
            formvalues.value = {
              planId: undefined,
              labelId: undefined,
            }
          },
          onCancel() {
            emitter.emit('cancel')
          },
        },
      }
    }))

  function handleCreate(note: Pick<InsertNote, 'labelId' | 'planId'>) {
    const now = Date.now()
    return db.note.insert({
      ...note,
      start: now,
      end: now,
    })
  }

  async function refresh() {
    [labelList.value, planList.value] = await Promise.all([db.label.select(), db.plan.select()])
  }

  async function openModal(value?: { planId: number; labelId: number }) {
    await refresh()

    if (value)
      formvalues.value = value

    await open()
    return new Promise<void>((resolve, reject) => {
      emitter.on('confirm', () => resolve())
      emitter.on('cancel', () => reject(new Error('cancel')))
    })
  }

  return {
    openModal,
  }
}
