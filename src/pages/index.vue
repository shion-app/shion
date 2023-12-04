<script setup lang="ts">
import type { GridStackWidget } from 'gridstack'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { db } from '@/modules/database'
import type { InsertOverview, SelectOverview } from '@/modules/database'
import { WidgetType } from '@/modules/database/models/overview'
import Grid from '@/components/grid/Grid.vue'

type OverviewForm = Pick<InsertOverview, 'type' | 'w' | 'h'>

const { t } = useI18n()
const { success } = useNotify()
const { parseFieldsError } = useDatabase()
const { SPAN } = useGrid()

const list = ref<Array<SelectOverview>>([])
const grid = ref<ComponentExposed<typeof Grid<any>>>()

const gridItems = computed(() => list.value.map(({ id, x, y, w, h }) => ({
  id: String(id), x, y, w, h,
})))

const cardList = computed(() => list.value.map(({ id, type, data }) => ({
  id,
  type,
  data,
})))

const { open, close, setModelValue } = useFormModal<OverviewForm>(model => ({
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
              if (v == WidgetType.ACTIVE_STATUS_CALENDAR) {
                setModelValue({
                  w: 3 * SPAN,
                })
              }
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
            disabled: model.type == WidgetType.ACTIVE_STATUS_CALENDAR,
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
      await refresh()
      grid.value?.compact()
    },
  },
}))

async function refresh() {
  list.value = await db.overview.select()
}

function showCreateForm() {
  open()
}

function handleCreate(overview: OverviewForm) {
  return db.overview.insert({
    ...overview,
    x: 0,
    y: 0,
    data: {},
  })
}

async function handleGridChange(items: number[], widgets: GridStackWidget[]) {
  const overviewList = widgets.map((widget) => {
    const { id, x, y, w, h = 1 } = widget
    return {
      id: Number(id),
      x,
      y,
      w,
      h,
    }
  }).filter((widget) => {
    const { id, x, y, w, h } = widget
    const item = list.value.find(i => i.id == id)!
    const hasChanged = item.x != x || item.y != y || item.w != w || item.h != h
    return hasChanged
  })
  await db.overview.batchUpdate(overviewList)
  await refresh()
}

refresh()
</script>

<template>
  <Grid
    v-if="list.length"
    ref="grid"
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
  </Grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item value="overview.create" :title="$t('overview.create')" @click="showCreateForm" />
    </v-list>
  </more-menu>
</template>
