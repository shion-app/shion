<script setup lang="ts">
import type { GridStackWidget } from 'gridstack'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { db } from '@/modules/database'
import type { InsertOverview, SelectLabel, SelectOverview, SelectPlan, SelectProgram } from '@/modules/database'
import { WidgetType } from '@/modules/database/models/overview'
import Grid from '@/components/grid/Grid.vue'

type OverviewForm = Pick<InsertOverview, 'type' | 'w' | 'h'> & { query?: [string, number] }

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

const { open, close, setModelValue } = useFormModal<
  OverviewForm,
  {
    planList: Array<SelectPlan>
    labelList: Array<SelectLabel>
    programList: Array<SelectProgram>
  }
>
((model, modal) => {
  const singleCategoryBarvisible = model.type == WidgetType.SINGLE_CATEGORY_BAR
  return {
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
          {
            type: 'cascader',
            key: 'query',
            label: t('widget.singleCategoryBar.table'),
            visible: singleCategoryBarvisible,
            props: {
              items: [
                {
                  title: t('widget.singleCategoryBar.plan'),
                  value: 'planId',
                  children: modal?.planList?.map(i => ({
                    title: i.name,
                    value: i.id,
                  })),
                },
                {
                  title: t('widget.singleCategoryBar.label'),
                  value: 'labelId',
                  children: modal?.labelList?.map(i => ({
                    title: i.name,
                    value: i.id,
                  })),
                },
                {
                  title: t('widget.singleCategoryBar.program'),
                  value: 'programId',
                  children: modal?.programList?.map(i => ({
                    title: i.name,
                    value: i.id,
                  })),
                },
              ],
            },
          },
        ],
      },
      schema: (z) => {
        const query = z.tuple([z.string(), z.number()])
        return z.object({
          type: z.number(),
          w: z.number(),
          h: z.number(),
          query: singleCategoryBarvisible ? query : query.optional(),
        })
      },
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
  }
}, async () => {
  const [planList, labelList, programList] = await Promise.all([
    db.plan.select(),
    db.label.select(),
    db.program.select(),
  ])
  return { planList, labelList, programList }
})

async function refresh() {
  list.value = await db.overview.select()
}

function showCreateForm() {
  setModelValue({
    w: SPAN,
    h: 1,
  })
  open()
}

function handleCreate(overview: OverviewForm) {
  const { w, h, type } = overview
  const value: InsertOverview = {
    w,
    h,
    type,
    x: 0,
    y: 0,
    data: {},
  }
  if (overview.query) {
    const [field, id] = overview.query
    const table = field == 'programId' ? db.activity.table : db.note.table
    value.data.query = {
      table,
      where: {
        [field]: id,
      },
    }
  }
  return db.overview.insert(value)
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
