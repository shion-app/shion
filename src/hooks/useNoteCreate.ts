import { db } from '@/modules/database'
import type { InsertNote, SelectLabel, SelectPlan } from '@/modules/database'

type NoteForm = Pick<InsertNote, 'planId' | 'labelId'>

export function useNoteCreate() {
  const { t } = useI18n()
  const { parseFieldsError } = useDatabase()
  const { start } = useTimerStore()

  const planList = ref<Array<SelectPlan>>([])
  const labelList = ref<Array<SelectLabel>>([])

  const { open, close, setModelValue } = useFormModal<NoteForm>(
    model => ({
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
                  setModelValue({
                    planId: v,
                    labelId: undefined,
                  })
                },
              },
            },
            {
              type: 'select',
              key: 'labelId',
              label: t('note.fill.label'),
              props: {
                items: labelList.value.filter(i => i.planId == model.planId).map(({ name, id }) => ({
                  title: name,
                  value: id,
                })),
              },
            },
          ],
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
        },
      },
    }))

  function handleCreate(note: NoteForm) {
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
      setModelValue(value)

    await open()
  }

  return {
    openModal,
  }
}
