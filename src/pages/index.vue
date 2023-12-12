<script setup lang="ts">
import type { GridStackWidget } from 'gridstack'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { db } from '@/modules/database'
import type { InsertOverview, SelectLabel, SelectOverview, SelectPlan, SelectProgram, UpdateOverview } from '@/modules/database'
import { WidgetType } from '@/modules/database/models/overview'
import Grid from '@/components/grid/Grid.vue'
import type { GridList } from '@/hooks/useGrid'
import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'

type OverviewForm = Pick<InsertOverview, 'type' | 'w' | 'h'> & { category?: [string, number] }

const { t } = useI18n()
const { success } = useNotify()
const { parseFieldsError } = useDatabase()

const list = ref<GridList<SelectOverview>>([])

const { col, wrap, select, selectedList } = useGrid(list)

const grid = ref<ComponentExposed<typeof Grid<any>>>()
const isCreate = ref(true)

const gridItems = computed(() => list.value.map(({ id, x, y, w, h }) => ({
  id: String(id), x, y, w, h,
})))

const cardList = computed(() => list.value.map(({ id, type, data, selected }) => ({
  id,
  type,
  data,
  selected,
})))

const { setUpdateId, handleUpdate } = buildUpdateFn()

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
      title: isCreate.value ? t('overview.create') : t('overview.update'),
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
                    w: col(3),
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
                value: col(i),
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
            key: 'category',
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
        const category = z.tuple([z.string(), z.number()])
        return z.object({
          type: z.number(),
          w: z.number(),
          h: z.number(),
          category: singleCategoryBarvisible ? category : category.optional(),
        })
      },
      async onConfirm(v, setErrors) {
        try {
          isCreate.value ? await handleCreate(v) : await handleUpdate(v)
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

const { open: openBatchRemoveModal } = useConfirmDeleteModal(async () => {
  await db.overview.batchRemove(selectedList.value)
  success({})
  await refresh()
  grid.value?.compact()
})

const { setRemoveId, remove } = buildRemoveFn()
const { open: openRemoveModal } = useConfirmDeleteModal(remove)

function handleRemove(id: number) {
  setRemoveId(id)
  openRemoveModal()
}

function buildRemoveFn() {
  let id = 0
  return {
    setRemoveId: (removeId: number) => {
      id = removeId
    },
    remove: async () => {
      await db.overview.remove(id)
      success({})
      await refresh()
      grid.value?.compact()
    },
  }
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (overview: OverviewForm) => {
      const { w, h, type, category } = overview
      const value: UpdateOverview = {
        w,
        h,
        type,
        data: {
          fields: {
            category,
          },
        },
      }
      if (overview.category)
        value.data!.query = transformCategory(overview.category)

      return db.overview.update(id, value)
    },
  }
}

async function refresh() {
  list.value = wrap(await db.overview.select())
}

function showCreateForm() {
  isCreate.value = true
  setModelValue({
    w: col(1),
    h: 1,
  })
  open()
}

function showUpdateForm(id: number, list: GridList<SelectOverview>) {
  setUpdateId(id)
  const overview = list.find(i => i.id == id)
  if (!overview)
    return

  isCreate.value = false
  const { type, w, h, data } = overview
  const value: Partial<OverviewForm> = {
    type,
    w,
    h,
  }
  if (data.fields)
    value.category = data.fields.category as [string, number]

  setModelValue(value)
  open()
}

function transformCategory(category: NonNullable<OverviewForm['category']>): SelectOverview['data']['query'] {
  const [field, id] = category
  const table = field == 'programId' ? db.activity.table : db.note.table
  return {
    table,
    where: {
      [field]: id,
    },
  }
}

function handleCreate(overview: OverviewForm) {
  const { w, h, type, category } = overview
  const value: InsertOverview = {
    w,
    h,
    type,
    x: 0,
    y: 0,
    data: {
      fields: {
        category,
      },
    },
  }
  if (overview.category)
    value.data.query = transformCategory(overview.category)

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
    :options="{ cellHeight: 200 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <grid-card :selected="componentProps.selected" @update:selected="v => select(componentProps.id, v)">
        <template #menu>
          <v-list-item value="button.update" :title="$t('button.update')" @click="showUpdateForm(componentProps.id, list)" />
          <v-list-item value="button.remove" :title="$t('button.remove')" @click="handleRemove(componentProps.id)" />
        </template>
        <v-card-text h-full class="pr-10!">
          <active-status-calendar v-if="componentProps.type == WidgetType.ACTIVE_STATUS_CALENDAR" />
          <single-category-bar v-else-if="componentProps.type == WidgetType.SINGLE_CATEGORY_BAR" :data="componentProps.data" />
        </v-card-text>
      </grid-card>
    </template>
  </Grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item value="overview.create" :title="$t('overview.create')" @click="showCreateForm" />
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" @click="openBatchRemoveModal" />
    </v-list>
  </more-menu>
</template>
