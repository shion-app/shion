<script setup lang="ts">
import type { Layout, LayoutItem } from 'grid-layout-plus'

import { db } from '@/modules/database'
import type { InsertOverview, SelectLabel, SelectOverview, SelectPlan, SelectProgram, UpdateOverview } from '@/modules/database'
import { WidgetType } from '@/modules/database/models/overview'
import Grid from '@/components/grid/Grid.vue'
import { type GridList } from '@/hooks/useGrid'
import { useConfirmModal } from '@/hooks/useConfirmModal'

type OverviewForm = Pick<InsertOverview, 'type' | 'w' | 'h'> & { category?: string; vertical?: boolean }

const { t } = useI18n()
const { success } = useNotify()
const { parseFieldsError } = useDatabase()
const { open: openNoteCreate } = useNoteCreate()
const { onRefresh, refresh } = usePageRefresh()
const { xs } = useTailwindBreakpoints()
const confirm = useConfirmModal()

const selectedDate = ref(new Date())
const list = ref<GridList<SelectOverview>>([])

const { wrap, select, selectedList } = useGrid(list)
const { column, col, count, safeColumn } = useGridColumn()

const isCreate = ref(true)

const gridItems = computed(() => {
  const items = list.value.map(({ id, x, y, w, h }) => ({
    i: id, x, y, w: safeColumn(w), h,
  }))
  return calculateLayout(items, column.value)
})

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
  const categoryVisible = model.type == WidgetType.SINGLE_CATEGORY_BAR || model.type == WidgetType.TEXT_SUMMARY
  const verticalVisible = model.type == WidgetType.SINGLE_CATEGORY_BAR || model.type == WidgetType.DAILY_ACTIVIRY
  const categoryItems: Array<{
    title: string
    value: string
  }> = []
  if (modal.planList?.length) {
    categoryItems.push(...modal.planList?.map(i => ({
      title: `${t('widget.singleCategoryBar.plan')}/${i.name}`,
      value: `planId/${i.id}`,
    })))
  }
  if (modal.labelList?.length) {
    categoryItems.push(...modal.labelList?.map(i => ({
      title: `${t('widget.singleCategoryBar.label')}/${i.name}`,
      value: `labelId/${i.id}`,
    })))
  }
  if (modal.programList?.length) {
    categoryItems.push(...modal.programList?.map(i => ({
      title: `${t('widget.singleCategoryBar.program')}/${i.name}`,
      value: `programId/${i.id}`,
    })))
  }
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
                props: {
                  subtitle: t(`widget.subtitle.${i}`),
                },
              })),
              'onUpdate:modelValue': (v) => {
                if (v == WidgetType.ACTIVE_STATUS_CALENDAR) {
                  setModelValue({
                    w: col(3),
                    h: 1,
                  })
                }
                else if (v == WidgetType.RECENT_ACTIVIRY_PIE) {
                  setModelValue({
                    w: col(2),
                    h: 2,
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
              items: new Array(count(column.value)).fill(0).map((_, i) => i + 1).map(i => ({
                title: i,
                value: col(i),
              })),
              disabled: model.type == WidgetType.ACTIVE_STATUS_CALENDAR || model.type == WidgetType.RECENT_ACTIVIRY_PIE,
            },
          },
          {
            type: 'select',
            key: 'h',
            label: t('widget.row'),
            props: {
              items: [1, 2, 3],
              disabled: model.type == WidgetType.ACTIVE_STATUS_CALENDAR || model.type == WidgetType.RECENT_ACTIVIRY_PIE,
            },
          },
          {
            type: 'autocomplete',
            key: 'category',
            label: t('widget.singleCategoryBar.table'),
            visible: categoryVisible,
            props: {
              items: categoryItems,
            },
          },
          {
            type: 'checkbox',
            key: 'vertical',
            label: t('widget.singleCategoryBar.vertical'),
            visible: verticalVisible,
          },
        ],
      },
      schema: (z) => {
        const category = z.string()
        return z.object({
          type: z.number(),
          w: z.number(),
          h: z.number(),
          category: categoryVisible ? category : category.optional(),
          vertical: z.boolean().optional(),
        })
      },
      async onConfirm(v, setErrors) {
        let widget
        if (v.category) {
          const [identifier, id] = v.category.split('/')
          const list
              = ((identifier == 'planId'
                ? modal.planList
                : identifier == 'labelId'
                  ? modal.labelList
                  : identifier == 'programId'
                    ? modal.programList
                    : []) || []).map(({ id, name, color }) => ({ id, title: name, color }))
          const { title, color } = list.find(i => i.id == Number(id))!
          widget = { title, color }
        }
        try {
          isCreate.value ? await handleCreate(v, widget) : await handleUpdate(v, widget)
        }
        catch (error) {
          return setErrors(parseFieldsError(error))
        }
        close()
        success({})
        refresh()
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

function openBatchRemoveModal() {
  confirm.delete({
    onConfirm: async () => {
      await db.overview.batchRemove(selectedList.value)
      success({})
      refresh()
    },
  })
}

function handleRemove(id: number) {
  confirm.delete({
    onConfirm: async () => {
      await db.overview.remove(id)
      success({})
      refresh()
    },
  })
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (overview: OverviewForm, widget: Record<string, unknown>) => {
      const { w, h, type, category, vertical } = overview
      const value: UpdateOverview = {
        w,
        h,
        type,
        data: {
          fields: {
            category,
            vertical,
          },
        },
      }
      if (overview.category)
        value.data!.query = transformCategory(overview.category)

      if (widget)
        value.data!.widget = widget

      return db.overview.update(id, value)
    },
  }
}

async function handleRefresh(reset = true) {
  if (reset)
    list.value = []

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
  if (data.fields) {
    value.category = data.fields.category as string
    value.vertical = data.fields.vertical as boolean
  }

  setModelValue(value)
  open()
}

function transformCategory(category: NonNullable<OverviewForm['category']>): SelectOverview['data']['query'] {
  const [field, id] = category.split('/')
  const table = field == 'programId' ? db.activity.table : db.note.table
  return {
    table,
    where: {
      [field]: id,
    },
  }
}

function handleCreate(overview: OverviewForm, widget?: Record<string, unknown>) {
  const { w, h, type, category, vertical } = overview
  const value: InsertOverview = {
    w,
    h,
    type,
    x: 0,
    y: 0,
    data: {
      fields: {
        category,
        vertical,
      },
    },
  }
  if (overview.category)
    value.data.query = transformCategory(overview.category)

  if (widget)
    value.data.widget = widget

  return db.overview.insert(value)
}

async function handleLayoutUpdated(list: number[], layout: Layout) {
  const overviewList = layout.map(({ i, x, y, w, h }) => ({
    id: Number(i),
    x,
    y,
    w,
    h,
  }))
  await db.overview.batchUpdate(overviewList)
}

function collides(l1: LayoutItem, l2: LayoutItem): boolean {
  if (l1.x + l1.w <= l2.x)
    return false
  if (l1.x >= l2.x + l2.w)
    return false
  if (l1.y + l1.h <= l2.y)
    return false
  if (l1.y >= l2.y + l2.h)
    return false
  return true
}

function getSafeLayoutItem(layoutItems: LayoutItem[], item: LayoutItem, column: number) {
  if (layoutItems.length == 0)
    return item

  let { x, y, w } = item
  while (layoutItems.some(i => collides(i, { ...item, x, y }))) {
    if (x + w > column) {
      x = 0
      y++
      continue
    }
    x++
  }
  return {
    ...item,
    x,
    y,
  }
}

function calculateLayout(layoutItems: LayoutItem[], column: number) {
  let x = 0
  const list: LayoutItem[] = []

  for (const item of layoutItems) {
    let y = 0

    if (x + item.w > column) {
      x = 0
      y++
    }

    const newLayoutItem = {
      ...item, x, y,
    }

    const safeLayoutItem = getSafeLayoutItem(list, newLayoutItem, column)

    list.push(safeLayoutItem)

    x += safeLayoutItem.w
  }

  return list
}

async function handleColumnChanged(column: number) {
  const newLayout = calculateLayout(gridItems.value, column)
  const overviewList = newLayout.map(({ i, x, y, w, h }) => ({
    id: Number(i),
    x,
    y,
    w,
    h,
  }))
  await db.overview.batchUpdate(overviewList)
  await handleRefresh(false)
}

onRefresh(handleRefresh)

refresh()
</script>

<template>
  <Grid
    v-if="list.length" ref="grid" :items="gridItems" :component-props="cardList" :options="{ cellHeight: 180 }"
    @layout-updated="handleLayoutUpdated" @column-changed="handleColumnChanged"
  >
    <template #default="{ componentProps }">
      <grid-card
        :selected="componentProps.selected" class="overflow-visible! hover:z-1"
        @update:selected="v => select(componentProps.id, v)"
      >
        <template #menu>
          <v-list-item
            value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline"
            base-color="red" @click="handleRemove(componentProps.id)"
          />
          <v-list-item
            value="button.update" :title="$t('button.update')" append-icon="mdi-pencil-outline"
            @click="showUpdateForm(componentProps.id, list)"
          />
        </template>
        <v-card-text
          h-full :class="{
            'pr-11!': isDesktop,
          }"
        >
          <active-status-calendar
            v-if="componentProps.type == WidgetType.ACTIVE_STATUS_CALENDAR"
            v-model:selected-date="selectedDate"
          />
          <single-category-bar
            v-else-if="componentProps.type == WidgetType.SINGLE_CATEGORY_BAR"
            :data="componentProps.data"
          />
          <text-summary v-else-if="componentProps.type == WidgetType.TEXT_SUMMARY" :data="componentProps.data" />
          <daily-activity
            v-else-if="componentProps.type == WidgetType.DAILY_ACTIVIRY" :selected-date="selectedDate"
            :data="componentProps.data"
          />
          <recent-activity-pie v-else-if="componentProps.type == WidgetType.RECENT_ACTIVIRY_PIE" />
        </v-card-text>
      </grid-card>
    </template>
  </Grid>
  <empty v-else type="overview" :width="250" :desc="$t('hint.overview')" />
  <more-menu>
    <v-list>
      <v-list-item
        v-if="selectedList.length" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal"
      />
      <v-list-item
        value="overview.create" :title="$t('overview.create')" append-icon="mdi-plus"
        @click="showCreateForm"
      />
      <v-list-item
        v-if="xs" value="label.button.start" :title="$t('label.button.start')"
        append-icon="mdi-timer-outline" @click="openNoteCreate"
      />
    </v-list>
  </more-menu>
  <status-bar-teleport>
    <status-bar-content :title="$t('nav.overview')" />
  </status-bar-teleport>
</template>
