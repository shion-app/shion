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
const { getItemsByOrder } = useGrid()

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

function showUpdateForm(id: number, list: Array<SelectLabel>) {
  const label = list.find(i => i.id == id)
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

function handleRemove(id: number) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await db.label.removeRelation(id)
        close()
        success({})
        refresh()
      },
    },
  })
  open()
}

async function handleStart(label: Pick<SelectLabel, 'id' | 'planId'>) {
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

async function handleGridChange(items: number[], list: Array<SelectLabel>) {
  const labelList = items.map((id, index) => {
    const { sort } = list[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => list[index].id != i.id)
  await db.label.batchUpdate(labelList)
  await refresh()
}

function getCardList(list: Array<SelectLabel>) {
  return list.map(({ id, name, totalTime, color, planId }) => ({
    id,
    title: name,
    totalTime,
    color,
    planId,
  }))
}

refresh()
</script>

<template>
  <div v-if="labelList.length" py-4 space-y-6>
    <div v-for="[id, list] in labelGroup" :key="id">
      <template v-if="list.length">
        <div p-x-4 text-5 font-bold>
          {{ planList.find(i => i.id == id)!.name }}
        </div>
        <grid
          :items="getItemsByOrder(list)"
          :component-props="getCardList(list)"
          :options="{ cellHeight: 150 }"
          @change="items => handleGridChange(items, list)"
        >
          <template #default="{ componentProps }">
            <time-card v-bind="componentProps" @update="id => showUpdateForm(id, list)" @remove="handleRemove">
              <template v-if="!timerRunning" #menu>
                <v-list-item value="timer" @click="handleStart(componentProps)">
                  <v-list-item-title>{{ $t('label.button.start') }}</v-list-item-title>
                </v-list-item>
              </template>
            </time-card>
          </template>
        </grid>
      </template>
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
