<script setup lang="ts">
import type { Label } from '@interfaces/index'
import { Modal, message } from 'ant-design-vue'

const { setMenu } = useMore()
const { t } = useI18n()
const router = useRouter()

const labelCreateVisible = ref(false)
const labelUpdateVisible = ref(false)
const labelModel = ref({} as Label)
const list = ref<Array<Label>>([])

async function refresh() {
  list.value = await selectLabel()
}

function handleUpdate(label: Label) {
  labelUpdateVisible.value = true
  Object.assign(labelModel.value, label)
}

function handleRemove(label: Label) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await removeLabel(label.id)
      message.success(t('message.success'))
      refresh()
    },
  })
}

function formatTime(time: number) {
  const { hour, minute } = extractTime(time).raw
  if (hour == 0) {
    return formatDuration({
      minutes: minute,
    })
  }
  return formatDuration({
    hours: hour,
    minutes: minute,
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
  <div
    v-if="list.length"
    grid grid-cols-3 gap-6 p-4
  >
    <div
      v-for="label in list"
      :key="label.id"
      rounded-2
      p-4
      bg-white
      shadow-lg
      hover:shadow-xl
      transition-shadow
      class="group"
      @click="viewNote(label.id)"
    >
      <div>{{ label.name }}</div>
      <div flex>
        <div>{{ formatTime(label.totalTime) }}</div>
        <div flex-1 />
        <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.update') }}</span>
            </template>
            <div i-mdi:file-edit text-6 cursor-pointer @click.stop="handleUpdate(label)" />
          </a-tooltip>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.remove') }}</span>
            </template>
            <div i-mdi:delete text-6 cursor-pointer @click.stop="handleRemove(label)" />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <label-create v-model:visible="labelCreateVisible" @refresh="refresh" />
  <label-update v-model:visible="labelUpdateVisible" :model="labelModel" @refresh="refresh" />
</template>
