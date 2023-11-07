<script setup lang="ts">
import type { useFormModalOptions } from '@/hooks/useFormModal'
import type { InsertPlan, SelectPlan } from '@/modules/database'
import { db } from '@/modules/database'

const { t } = useI18n()
const { parseFieldsError } = useDatabase()
const router = useRouter()
const { success } = useNotify()

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

async function refresh() {
  list.value = await db.plan.select()
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(plan: SelectPlan) {
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

function handleRemove(plan: SelectPlan) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await db.plan.removeRelation(plan.id)
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
  <div
    v-if="list.length"
    grid grid-cols-3 gap-6 p-4
  >
    <div
      v-for="plan in list"
      :key="plan.id"
      rounded-2
      p-4
      bg-white
      shadow-lg
      hover:shadow-xl
      transition-shadow
      space-y-2
    >
      <div flex justify-between items-center>
        <div truncate :title="plan.name">
          {{ plan.name }}
        </div>
        <div
          w-3 h-3 rounded-full mx-1 flex-shrink-0
          :style="{
            backgroundColor: plan.color,
          }"
        />
      </div>
      <div flex class="group">
        <div>{{ formatHHmmss(plan.totalTime) }}</div>
        <div flex-1 />
        <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
          <v-tooltip :text="$t('button.update')" location="bottom">
            <template #activator="{ props }">
              <div i-mdi:file-edit-outline text-5 cursor-pointer v-bind="props" @click.stop="showUpdateForm(plan)" />
            </template>
          </v-tooltip>
          <v-tooltip :text="$t('button.remove')" location="bottom">
            <template #activator="{ props }">
              <div i-mdi:delete-outline text-5 cursor-pointer v-bind="props" @click.stop="handleRemove(plan)" />
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div>
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
