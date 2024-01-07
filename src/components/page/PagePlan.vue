<script setup lang="ts">
import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'
import type { GridList } from '@/hooks/useGrid'
import { useGrid } from '@/hooks/useGrid'
import type { InsertPlan, SelectPlan } from '@/modules/database'
import { db } from '@/modules/database'

type PlanForm = Pick<InsertPlan, 'name' | 'color'>

const { t } = useI18n()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()

const list = ref<GridList<SelectPlan>>([])

const { items, wrap, select, selectedList } = useGrid(list)

const isCreate = ref(true)

const { setUpdateId, handleUpdate } = buildUpdateFn()

const { open, close, setModelValue } = useFormModal<PlanForm>(
  () => ({
    attrs: {
      title: isCreate.value ? t('plan.create') : t('plan.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('plan.name'),
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('plan.color'),
          },
        ],
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
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

const { open: openBatchRemoveModal } = useConfirmDeleteModal(async () => {
  await Promise.all(selectedList.value.map(id => db.plan.removeRelation(id)))
  success({})
  refresh()
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
      await db.plan.removeRelation(id)
      success({})
      refresh()
    },
  }
}

async function refresh() {
  list.value = wrap(await db.plan.select())
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(id: number) {
  setUpdateId(id)
  const plan = list.value.find(i => i.id == id)
  if (!plan)
    return

  isCreate.value = false
  setModelValue(plan)
  open()
}

async function handleCreate(plan: PlanForm) {
  // todo: db event listener
  const { lastInsertId } = await db.plan.insert(plan)
  await db.plan.update(lastInsertId, {
    sort: lastInsertId,
  })
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (plan: PlanForm) => {
      return db.plan.update(id, plan)
    },
  }
}

async function handleGridChange(items: number[]) {
  const planList = items.map((id, index) => {
    const { sort } = list.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => list.value[index].id != i.id)
  await db.plan.batchUpdate(planList)
  await refresh()
}

refresh()
</script>

<template>
  <grid
    v-if="list.length"
    :items="items"
    :component-props="cardList"
    :options="{ cellHeight: 120 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <time-card
        v-bind="componentProps"
        @update="showUpdateForm"
        @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)"
      />
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal" />
      <v-list-item value="plan.create" :title="$t('plan.create')" append-icon="mdi-plus" @click="showCreateForm" />
    </v-list>
  </more-menu>
</template>
