<script setup lang="ts">
import type { GridList } from '@/hooks/useGrid'
import { db } from '@/modules/database'
import type { InsertLabel, SelectLabel, SelectPlan } from '@/modules/database'

type LabelForm = Pick<InsertLabel, 'name' | 'planId' | 'color'>

const timeStore = useTimerStore()
const { t } = useI18n()
const router = useRouter()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()
const { openModal } = useNoteCreate()

const labelList = ref<GridList<SelectLabel>>([])
const { wrap, getItemsByOrder, select, selectedList } = useGrid(labelList)

const { running: timerRunning } = storeToRefs(timeStore)

const planList = ref<Array<SelectPlan>>([])
const isCreate = ref(true)
let updateId = 0

const labelGroup = computed(() => {
  const map = new Map<number, GridList<SelectLabel>>()
  for (const label of labelList.value) {
    const list = map.get(label.planId)
    map.set(label.planId, [...(list || []), label])
  }
  return map
})

const { open, close, setModelValue } = useFormModal<LabelForm>(
  () => ({
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
  }))

async function refresh() {
  [labelList.value, planList.value] = await Promise.all([db.label.select().then(wrap), db.plan.select()])
}

function showCreateForm() {
  isCreate.value = true
  open()
}

function showUpdateForm(id: number, list: GridList<SelectLabel>) {
  updateId = id
  const label = list.find(i => i.id == id)
  if (!label)
    return

  isCreate.value = false
  setModelValue(label)
  open()
}

async function handleCreate(label: LabelForm) {
  // todo: db event listener
  const { lastInsertId } = await db.label.insert(label)
  await db.label.update(lastInsertId, {
    sort: lastInsertId,
  })
}

function handleUpdate(label: LabelForm) {
  return db.label.update(updateId, label)
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

async function handleGridChange(items: number[], list: GridList<SelectLabel>) {
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

function getCardList(list: GridList<SelectLabel>) {
  return list.map(({ id, name, totalTime, color, planId, selected }) => ({
    id,
    title: name,
    totalTime,
    color,
    planId,
    selected,
  }))
}

async function removeList() {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await Promise.all(selectedList.value.map(id => db.label.removeRelation(id)))
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
  <div v-if="labelList.length" py-4 space-y-6>
    <div v-for="[id, list] in labelGroup" :key="id">
      <template v-if="list.length">
        <div p-x-4 text-5 font-bold>
          {{ planList.find(i => i.id == id)!.name }}
        </div>
        <grid
          :items="getItemsByOrder(list)"
          :component-props="getCardList(list)"
          :options="{ cellHeight: 130 }"
          @change="items => handleGridChange(items, list)"
        >
          <template #default="{ componentProps }">
            <time-card
              v-bind="componentProps"
              @update="id => showUpdateForm(id, list)"
              @remove="handleRemove"
              @update:selected="v => select(componentProps.id, v)"
            >
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
      <v-list-item value="label.create" :title="$t('label.create')" @click="showCreateForm" />
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" @click="removeList" />
    </v-list>
  </more-menu>
</template>
