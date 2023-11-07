<script setup lang="ts">
import type { useFormModalOptions } from '@/hooks/useFormModal'
import { db } from '@/modules/database'
import type { InsertLabel, SelectLabel, SelectPlan } from '@/modules/database'

const timeStore = useTimerStore()
const { t } = useI18n()
const router = useRouter()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()
const { openModal } = useNoteCreate()

const { running: timerRunning } = storeToRefs(timeStore)

const labelList = ref<Array<SelectLabel>>([])
const planList = ref<Array<SelectPlan>>([])
const isCreate = ref(true)
const model = ref<SelectLabel>()

const labelGroup = computed(() => {
  const map = new Map<number, Array<SelectLabel>>()
  for (const label of labelList.value) {
    if (!map.has(label.planId))
      map.set(label.planId, [])

    const list = map.get(label.planId)!
    list.push(label)
    map.set(label.planId, list)
  }
  return map
})

const { open, close } = useFormModal(
  computed<useFormModalOptions>(() => ({
    attrs: {
      title: isCreate.value ? t('label.create') : t('label.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('label.name'),
          },
          {
            type: 'select',
            key: 'planId',
            label: t('label.plan'),
            props: {
              items: planList.value.map(({ name, id }) => ({
                title: name,
                value: id,
              })),
            },
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('label.color'),
          },
        ],
        values: isCreate.value ? {} : model.value,
      },
      schema: z => z.object({
        name: z.string().min(1),
        planId: z.number(),
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

async function refresh() {
  [labelList.value, planList.value] = await Promise.all([db.label.select(), db.plan.select()])
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(label: SelectLabel) {
  model.value = label
  isCreate.value = false
  open()
}

function handleCreate(label: InsertLabel) {
  return db.label.insert(label)
}

function handleUpdate(label: InsertLabel) {
  return db.label.update(model.value!.id, label)
}

function handleRemove(label: SelectLabel) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await db.label.removeRelation(label.id)
        close()
        success({})
        refresh()
      },
    },
  })
  open()
}

async function handleStart(label: SelectLabel) {
  try {
    await openModal({
      labelId: label.id,
      planId: label.planId,
    })
  }
  catch (error) {
    return
  }
  router.push('/timer')
}

function viewNote(labelId: number) {
  router.push({
    path: '/note',
    query: {
      labelId,
    },
  })
}

refresh()
</script>

<template>
  <div v-if="labelList.length" py-4 space-y-6>
    <div v-for="group in labelGroup" :key="group[0]">
      <div p-x-4 text-5 font-bold>
        {{ planList.find(i => i.id == group[0])!.name }}
      </div>
      <div grid grid-cols-3 gap-6 py-2 px-4>
        <div
          v-for="label in group[1]"
          :key="label.id"
          rounded-2 p-4 bg-white shadow-lg hover:shadow-xl transition-shadow space-y-2
          @click="viewNote(label.id)"
        >
          <div flex justify-between items-center>
            <div truncate :title="label.name">
              {{ label.name }}
            </div>
            <div
              w-3 h-3 rounded-full mx-1 flex-shrink-0
              :style="{
                backgroundColor: label.color,
              }"
            />
          </div>
          <div flex class="group">
            <div>{{ formatHHmmss(label.totalTime) }}</div>
            <div flex-1 />
            <div flex space-x-1 op-0 group-hover-op-100 transition-opacity-400>
              <v-tooltip :text="$t('button.update')" location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:file-edit-outline text-5 cursor-pointer v-bind="props" @click.stop="showUpdateForm(label)" />
                </template>
              </v-tooltip>
              <v-tooltip :text="$t('button.remove')" location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:delete-outline text-5 cursor-pointer v-bind="props" @click.stop="handleRemove(label)" />
                </template>
              </v-tooltip>
              <v-tooltip v-if="!timerRunning" :text="$t('label.button.start')" location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:play-circle-outline text-5 cursor-pointer v-bind="props" @click.stop="handleStart(label)" />
                </template>
              </v-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item value="label.create">
        <v-list-item-title @click="showCreateForm">
          {{ $t('label.create') }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </more-menu>
</template>
