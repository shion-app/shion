<script setup lang="ts">
import { timelineInject } from '../inject'
import type { TimeLineNodeCommonGraphData } from '@/interfaces'
import { type SelectNote, db } from '@/modules/database'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: SelectNote
}>()

defineOptions({
  inheritAttrs: false,
})

const { formatHHmmss } = useDateFns()
const { t } = useI18n()

const { handleSuccess } = timelineInject()

const { open: openUpdateForm, close: closeUpdateForm, setModelValue } = useFormModal<{
  start: number
  end: number
}>(
  (model) => {
    return {
      attrs: {
        title: t('timelineGraph.update.title'),
        form: {
          fields: [
            {
              type: 'datetimePicker',
              key: 'start',
              label: t('timelineGraph.update.start'),
              props: {
                max: model.end,
              },
            },
            {
              type: 'datetimePicker',
              key: 'end',
              label: t('timelineGraph.update.end'),
              props: {
                min: model.start,
              },
            },
          ],
        },
        schema: z => z.object({
          start: z.number(),
          end: z.number(),
        }),
        async onConfirm(v) {
          await db.note.update(props.raw.id, v)
          await closeUpdateForm()
          await handleSuccess()
        },
      },
    }
  })

async function removeNote() {
  await db.note.remove(props.raw.id)
  await handleSuccess()
}

async function updateNote() {
  setModelValue({
    start: props.raw.start,
    end: props.raw.end,
  })
  await openUpdateForm()
}
</script>

<template>
  <div
    v-bind="$attrs" i-mdi:timer :class="{
      'cursor-pointer': props.data.children == 0,
    }"
  >
    <v-menu v-if="props.data.children == 0" activator="parent" location="start" :offset="[20, 10]">
      <v-list min-width="100">
        <v-list-item
          value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline"
          base-color="red" @click="removeNote()"
        />
        <v-list-item
          value="button.update" :title="$t('button.update')" append-icon="mdi-pencil-outline"
          @click="updateNote()"
        />
      </v-list>
    </v-menu>
    <v-tooltip activator="parent" :text="props.data.children == 0 ? $t('timelineGraph.note.tooltip') : $t('timelineGraph.note.compress')" location="start" />
  </div>
  <div>
    <div :class="props.data.children ? 'line-clamp-2' : 'line-clamp-1'" break-all>
      {{ props.data.title }}
    </div>
    <div v-if="props.data.children">
      {{ $t('timelineGraph.include', {
        count: props.data.children,
        totalTime: formatHHmmss(props.data.totalTime),
      })
      }}
    </div>
  </div>
</template>
