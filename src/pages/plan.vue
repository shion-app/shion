<script setup lang="ts">
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
let updateId = 0

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

async function refresh() {
  list.value = wrap(await db.plan.select())
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(id: number) {
  updateId = id
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

function handleUpdate(plan: PlanForm) {
  return db.plan.update(updateId, plan)
}

function handleRemove(id: number) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await db.plan.removeRelation(id)
        close()
        success({})
        refresh()
      },
    },
  })
  open()
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

async function removeList() {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await Promise.all(selectedList.value.map(id => db.plan.removeRelation(id)))
        close()
        success({})
        refresh()
      },
    },
  })
  open()
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
      <v-list-item value="plan.create" :title="$t('plan.create')" @click="showCreateForm" />
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" @click="removeList" />
    </v-list>
  </more-menu>
</template>
