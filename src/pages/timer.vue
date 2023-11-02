<script setup lang="ts">
import type { useFormModalOptions } from '@/hooks/useFormModal'
import type { InsertNote, SelectLabel, SelectPlan } from '@/modules/database'
import { db } from '@/modules/database'

const store = useTime()
const { t } = useI18n()
const { parseError } = useDatabase()
const { success } = useNotify()

const { running } = storeToRefs(store)
const { start, finish } = store

const planList = ref<Array<SelectPlan>>([])
const labelList = ref<Array<SelectLabel>>([])

const formvalues = reactive({
  planId: undefined,
  labelId: undefined,
})

async function init() {
  [labelList.value, planList.value] = await Promise.all([db.label.select(), db.plan.select()])
}

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
                  formvalues.planId = v
                  formvalues.labelId = undefined
                },
              },
            },
            {
              type: 'select',
              key: 'labelId',
              label: t('note.fill.label'),
              props: {
                items: labelList.value.filter(i => i.planId == formvalues.planId).map(({ name, id }) => ({
                  title: name,
                  value: id,
                })),
              },
            },
          ],
          values: formvalues,
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
            return setErrors(parseError(error))
          }
          close()
          start(false, 0, () => db.note.update(noteId, {
            end: Date.now(),
          }))
        },
        onClosed() {
          Object.assign(formvalues, {
            planId: undefined,
            labelId: undefined,
          })
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

async function finishTimer() {
  await finish()
  success({})
}

init()
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <display text-20 />
    <div
      shadow-lg hover:shadow-xl transition-shadow w-20 h-20 rounded-full cursor-pointer text-12 flex justify-center items-center bg-white
      @click="() => {
        running ? finishTimer() : open()
      }"
    >
      <div :class="running ? 'i-mdi:stop' : 'i-mdi:play'" />
    </div>
  </div>
</template>
