<script setup lang="ts">
import type { useFormModalOptions } from '@/hooks/useFormModal'
import { useGrid } from '@/hooks/useGrid'
import type { InsertPlan, SelectPlan } from '@/modules/database'
import { db } from '@/modules/database'

const { t } = useI18n()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()
const { getItemsByOrder } = useGrid()

const model = ref<SelectPlan>()
const isCreate = ref(true)

const { open, close } = useFormModal(
  computed<useFormModalOptions>(() => ({
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
        values: isCreate.value ? {} : model.value,
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
  })))

const list = ref<Array<SelectPlan>>([])

const cardList = computed(() => list.value.map(({ id, name, totalTime, color }) => ({
  id,
  title: name,
  totalTime,
  color,
})))

async function refresh() {
  list.value = await db.plan.select()
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(id: number) {
  const plan = list.value.find(i => i.id == id)
  model.value = plan
  isCreate.value = false
  open()
}

function handleCreate(plan: InsertPlan) {
  return db.plan.insert(plan)
}

function handleUpdate(plan: InsertPlan) {
  return db.plan.update(model.value!.id, plan)
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

refresh()
</script>

<template>
  <grid
    v-if="list.length"
    :items="getItemsByOrder(list)"
    :component-props="cardList"
    :options="{ cellHeight: 150 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <time-card v-bind="componentProps" @update="showUpdateForm" @remove="handleRemove" />
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item value="plan.create">
        <v-list-item-title @click="showCreateForm">
          {{ $t('plan.create') }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </more-menu>
</template>
