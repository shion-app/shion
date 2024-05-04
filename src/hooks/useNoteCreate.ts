import { db } from '@/modules/database'
import type { InsertNote, SelectLabel, SelectPlan } from '@/modules/database'

type NoteForm = Pick<InsertNote, 'planId' | 'labelId'>

export function useNoteCreate() {
  const { t } = useI18n()
  const { parseFieldsError } = useDatabase()
  const { start, setText } = useTimerStore()

  const { open, close, setModelValue } = useFormModal<NoteForm, {
    planList: Array<SelectPlan>
    labelList: Array<SelectLabel>
  }>(
    (model, modal) => {
      const labelList = (modal?.labelList || []).filter(i => i.planId == model.planId)
      return {
        attrs: {
          title: t('note.fill.title'),
          form: {
            fields: [
              {
                type: 'autocomplete',
                key: 'planId',
                label: t('note.fill.plan'),
                props: {
                  'items': (modal?.planList || []).map(({ name, id }) => ({
                    title: name,
                    value: id,
                  })),
                  'onUpdate:modelValue': () => {
                    setModelValue({
                      labelId: undefined,
                    })
                  },
                  'autoSelectFirst': 'exact',
                },
              },
              {
                type: 'autocomplete',
                key: 'labelId',
                label: t('note.fill.label'),
                props: {
                  items: labelList.map(({ name, id }) => ({
                    title: name,
                    value: id,
                  })),
                  autoSelectFirst: 'exact',
                },
              },
            ],
          },
          schema: z => z.object({
            planId: z.number(),
            labelId: z.number(),
          }),
          async onConfirm(v, setErrors) {
            setText(labelList.find(i => i.id == v.labelId)!.name)
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
      }
    }, async () => {
      const [planList, labelList] = await Promise.all([
        db.plan.select(),
        db.label.select(),
      ])
      return { planList, labelList }
    })

  function handleCreate(note: NoteForm) {
    const now = Date.now()
    return db.note.insert({
      ...note,
      start: now,
      end: now,
    })
  }

  return { open, setModelValue }
}
