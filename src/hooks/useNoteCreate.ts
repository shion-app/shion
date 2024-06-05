import { db } from '@/modules/database'
import type { InsertNote, SelectLabel, SelectPlan } from '@/modules/database'

type NoteForm = Pick<InsertNote, 'planId' | 'labelId'> & Partial<Pick<InsertNote, 'start' | 'end'>> & { direct?: boolean }

export function useNoteCreate() {
  const { t } = useI18n()
  const { parseFieldsError } = useDatabase()
  const { start: startTimer, setText } = useTimerStore()
  const { success } = useNotify()

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
              {
                type: 'checkbox',
                key: 'direct',
                label: t('note.fill.direct'),
                props: {
                  'onUpdate:modelValue': () => {
                    setModelValue({
                      start: new Date().getTime(),
                      end: new Date().getTime(),
                    })
                  },
                },
              },
              {
                type: 'datetimePicker',
                key: 'start',
                label: t('note.fill.start'),
                visible: !!model.direct,
                props: {
                  max: model.end,
                },
              },
              {
                type: 'datetimePicker',
                key: 'end',
                label: t('note.fill.end'),
                visible: !!model.direct,
                props: {
                  min: model.start,
                },
              },
            ],
          },
          schema: (z) => {
            const start = z.number()
            const end = z.number()
            return z.object({
              planId: z.number(),
              labelId: z.number(),
              direct: z.boolean().optional(),
              start: model.direct ? start : start.optional(),
              end: model.direct ? end : end.optional(),
            })
          },
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
            if (v.direct) {
              success({})
              return
            }
            startTimer(() => db.note.update(noteId, {
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
    const { planId, labelId, direct, start, end } = note
    return db.note.insert({
      planId,
      labelId,
      start: direct ? start! : now,
      end: direct ? end! : now,
    })
  }

  return { open, setModelValue }
}
