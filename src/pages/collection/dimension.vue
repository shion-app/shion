<script setup lang="ts">
import { useConfirmModal } from '@/hooks/useConfirmModal'
import type { GridList } from '@/hooks/useGrid'
import { useGrid } from '@/hooks/useGrid'
import type { InsertDimension, SelectDimension } from '@/modules/database'
import { db } from '@/modules/database'

type DimensionForm = Pick<InsertDimension, 'name' | 'color' | 'code'>

const { t } = useI18n()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()
const { onRefresh } = usePageRefresh()
const confirm = useConfirmModal()

const list = ref<GridList<SelectDimension>>([])
const markDialogVisible = ref(false)
const markDialogDimensionId = ref(0)

const { items, wrap, select, selectedList } = useGrid(list)

const isCreate = ref(true)

const { setUpdateId, handleUpdate } = buildUpdateFn()

const { open, close, setModelValue } = useFormModal<DimensionForm>(
  () => ({
    attrs: {
      title: isCreate.value ? t('dimension.create') : t('dimension.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('dimension.name'),
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('dimension.color'),
          },
          {
            type: 'select',
            key: 'code',
            label: t('dimension.code'),
            props: {
              items: [],
            },
          },
        ],
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
        code: z.string().optional(),
      }),
      async onConfirm(v, setErrors) {
        try {
          isCreate.value ? await handleCreate(v) : await handleUpdate(v)
        }
        catch (error) {
          return setErrors(parseFieldsError(error))
        }
        close()
        success({})
        refresh()
      },
    },
  }))

const cardList = computed(() => list.value.map(({ id, name, totalTime, color, selected }) => ({
  id,
  title: name,
  totalTime,
  color,
  selected,
})))

function openBatchRemoveModal() {
  confirm.delete({
    onConfirm: async () => {
      await db.dimension.batchRemove(selectedList.value)
      success({})
      await refresh()
    },
  })
}

function handleRemove(id: number) {
  confirm.delete({
    onConfirm: async () => {
      await db.dimension.removeRelation(id)
      success({})
      await refresh()
    },
  })
}

async function refresh() {
  list.value = wrap(await db.dimension.select())
}

function showCreateForm() {
  isCreate.value = true
  setModelValue({
    color: randomColor(),
  })
  open()
}

function showUpdateForm(id: number) {
  setUpdateId(id)
  const dimension = list.value.find(i => i.id == id)
  if (!dimension)
    return

  isCreate.value = false
  setModelValue(dimension)
  open()
}

async function handleCreate(dimension: DimensionForm) {
  await db.dimension.transactionInsert(dimension)
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (dimension: DimensionForm) => {
      return db.dimension.update(id, dimension)
    },
  }
}

async function handleLayoutUpdated(items: number[]) {
  const dimensionList = items.map((id, index) => {
    const { sort } = list.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => list.value[index].id != i.id)
  if (dimensionList.length) {
    await db.dimension.batchUpdate(dimensionList)
    await refresh()
  }
}

// function navigate(id: number) {
//   router.push({
//     path: '/timeline',
//     query: {
//       category: 'dimension',
//       id,
//     },
//   })
// }

function handleMarkStart(id: number) {
  markDialogDimensionId.value = id
  markDialogVisible.value = true
}

function handleMarkSubmit() {
  markDialogDimensionId.value = 0
  markDialogVisible.value = false
  success({})
  refresh()
}

onRefresh(refresh)

refresh()
</script>

<template>
  <grid
    v-if="list.length" :items="items" :component-props="cardList" :options="{ cellHeight: 100 }"
    @layout-updated="handleLayoutUpdated"
  >
    <template #default="{ componentProps }">
      <time-card
        v-bind="componentProps" @update="showUpdateForm" @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)"
      >
        <template #menu>
          <v-list-item
            value="dimension.mark" :title="$t('dimension.mark')" append-icon="mdi-star-outline"
            @click="handleMarkStart(componentProps.id)"
          />
        </template>
      </time-card>
    </template>
  </grid>
  <empty v-else type="dimension" :desc="$t('hint.dimension')" :width="250" />
  <more-menu>
    <v-list>
      <v-list-item
        v-if="selectedList.length" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal"
      />
      <v-list-item
        value="dimension.create" :title="$t('dimension.create')" append-icon="mdi-plus"
        @click="showCreateForm"
      />
    </v-list>
  </more-menu>
  <dimension-mark
    v-model:visible="markDialogVisible" :dimension-id="markDialogDimensionId"
    @submit="handleMarkSubmit"
  />
</template>
