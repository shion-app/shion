<script setup lang="ts">
import { Modal, message } from 'ant-design-vue'
import { type SelectLabel, type SelectPlan, db } from '@modules/database'

const { setMenu } = useMore()
const timeStore = useTime()
const { t } = useI18n()
const router = useRouter()

const { running: timerRunning } = storeToRefs(timeStore)
const { start } = timeStore

const labelCreateVisible = ref(false)
const labelUpdateVisible = ref(false)
const noteBeforeCreateVisible = ref(false)
const labelCreateModel = ref({
  name: '',
  planId: undefined,
  color: randomColor(),
} as unknown as SelectLabel)
const labelUpdateModel = ref({} as SelectLabel)
const noteBeforeCreateForm = ref({
  planId: 0,
  labelId: 0,
})
const labelList = ref<Array<SelectLabel>>([])
const planList = ref<Array<SelectPlan>>([])
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

async function refresh() {
  [labelList.value, planList.value] = await Promise.all([db.label.select(), db.plan.select()])
}

function handleUpdate(label: SelectLabel) {
  labelUpdateVisible.value = true
  Object.assign(labelUpdateModel.value, label)
}

function handleRemove(label: SelectLabel) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await db.label.removeRelation(label.id)
      message.success(t('message.success'))
      refresh()
    },
  })
}

function viewNote(labelId: number) {
  router.push({
    path: '/note',
    query: {
      labelId,
    },
  })
}

async function handleStart(label: SelectLabel) {
  noteBeforeCreateVisible.value = true
  noteBeforeCreateForm.value = {
    labelId: 0,
    planId: 0,
  }
  await nextTick()
  noteBeforeCreateForm.value = {
    labelId: label.id,
    planId: label.planId,
  }
}

async function create({
  noteId,
  countdown,
  time,
}: {
  noteId: number
  countdown: boolean
  time: number
}) {
  start(countdown, time, () => db.note.update(noteId, {
    end: Date.now(),
  }))
  router.push('/time')
}

setMenu(() => [
  {
    key: 'createLabel',
    title: t('label.create'),
    click() {
      labelCreateVisible.value = true
    },
  },
])

refresh()
</script>

<template>
  <div v-if="labelList.length">
    <div v-for="group in labelGroup" :key="group[0]">
      <div p-x-4 text-5 font-bold>
        {{ planList.find(i => i.id == group[0])!.name }}
      </div>
      <div grid grid-cols-3 gap-6 p-4>
        <div
          v-for="label in group[1]"
          :key="label.id"
          rounded-2 p-4 bg-white shadow-lg hover:shadow-xl transition-shadow space-y-2
          @click="viewNote(label.id)"
        >
          <div flex justify-between>
            <div>{{ label.name }}</div>
            <div
              w-3 h-3 rounded-full mr-1
              :style="{
                backgroundColor: label.color,
              }"
            />
          </div>
          <div flex class="group">
            <div>{{ formatHHmmss(label.totalTime) }}</div>
            <div flex-1 />
            <div flex space-x-1 op-0 group-hover-op-100 transition-opacity-400>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.update') }}</span>
                </template>
                <div i-mdi:file-edit-outline text-5 cursor-pointer @click.stop="handleUpdate(label)" />
              </a-tooltip>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.remove') }}</span>
                </template>
                <div i-mdi:delete-outline text-5 cursor-pointer @click.stop="handleRemove(label)" />
              </a-tooltip>
              <a-tooltip v-if="!timerRunning" placement="bottom">
                <template #title>
                  <span>{{ $t('label.button.start') }}</span>
                </template>
                <div i-mdi:play-circle-outline text-5 cursor-pointer @click.stop="handleStart(label)" />
              </a-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <label-form v-model:visible="labelCreateVisible" v-model:model="labelCreateModel" type="create" @refresh="refresh" />
  <label-form v-model:visible="labelUpdateVisible" type="update" :model="labelUpdateModel" @refresh="refresh" />
  <note-before-create v-model:visible="noteBeforeCreateVisible" :form="noteBeforeCreateForm" @finish="create" />
</template>
