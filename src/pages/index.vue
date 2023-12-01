<script setup lang="ts">
import type { useFormModalOptions } from '@/hooks/useFormModal'
import { db } from '@/modules/database'
import type { InsertOverview, SelectOverview } from '@/modules/database'

import { WidgetType } from '@/modules/database/models/overview'

const { t } = useI18n()
const { success } = useNotify()
const { parseFieldsError } = useDatabase()
const { SPAN } = useGrid()

const list = ref<Array<SelectOverview>>([])
const model = ref<{
  type?: WidgetType
  w: number
  h: number
}>({
  type: undefined,
  w: 1,
  h: 1,
})
const columnSelectDisabled = computed(() => model.value.type == WidgetType.ACTIVE_STATUS_CALENDAR)

const gridItems = computed(() => list.value.map(({ id, x, y, w, h }) => ({
  id: String(id), x, y, w, h,
})))

const cardList = computed(() => list.value.map(({ id, type, data }) => ({
  id,
  type,
  data,
})))

const { open, close } = useFormModal(
  computed<useFormModalOptions>(() => ({
    attrs: {
      title: t('overview.create'),
      form: {
        fields: [
          {
            type: 'select',
            key: 'type',
            label: t('widget.type'),
            props: {
              'items': Object.values(WidgetType).filter(i => typeof i == 'string').map(i => ({
                title: t(`widget.typeDesc.${i}`),
                value: WidgetType[i],
              })),
              'onUpdate:modelValue': (v) => {
                model.value.type = v

                if (v == WidgetType.ACTIVE_STATUS_CALENDAR)
                  model.value.w = 3 * SPAN
              },
            },
          },
          {
            type: 'select',
            key: 'w',
            label: t('widget.column'),
            props: {
              items: [1, 2, 3].map(i => ({
                title: i,
                value: i * SPAN,
              })),
              disabled: columnSelectDisabled.value,
            },
          },
          {
            type: 'select',
            key: 'h',
            label: t('widget.row'),
            props: {
              items: [1, 2, 3],
            },
          },
        ],
        values: model.value,
      },
      schema: z => z.object({
        type: z.number(),
        w: z.number(),
        h: z.number(),
      }),
      async onConfirm(v, setErrors) {
        try {
          await handleCreate(v)
        }
        catch (error) {
          return setErrors(parseFieldsError(error))
        }
        close()
        success({})
        refresh()
      },
      onClosed() {
        model.value = {
          type: undefined,
          w: 1,
          h: 1,
        }
      },
    },
  })))

async function refresh() {
  list.value = await db.overview.select()
}

function showCreateForm() {
  open()
}

function handleCreate(overview: Pick<InsertOverview, 'type' | 'w' | 'h'>) {
  return db.overview.insert({
    ...overview,
    x: 0,
    y: 0,
    data: {},
  })
}

async function handleGridChange(items: number[]) {
}

refresh()
</script>

<template>
  <grid
    v-if="list.length"
    :items="gridItems"
    :component-props="cardList"
    :options="{ cellHeight: 150 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <div>
        {{ componentProps.type }}
      </div>
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item value="overview.create" :title="$t('overview.create')" @click="showCreateForm" />
    </v-list>
  </more-menu>
</template>
