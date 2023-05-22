<script setup lang="ts">
import type { Label, Plan } from '@interfaces/index'
import { Modal, message } from 'ant-design-vue'

const { setMenu } = useMore()
const { t } = useI18n()
const router = useRouter()

const labelCreateVisible = ref(false)
const labelUpdateVisible = ref(false)
const labelCreateModel = ref({
  name: '',
  planId: undefined,
  color: randomColor(),
} as unknown as Label)
const labelUpdateModel = ref({} as Label)
const labelList = ref<Array<Label>>([])
const planList = ref<Array<Plan>>([])

async function refresh() {
  [labelList.value, planList.value] = await Promise.all([selectLabel(), selectPlan()])
}

function handleUpdate(label: Label) {
  labelUpdateVisible.value = true
  Object.assign(labelUpdateModel.value, label)
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
  <div v-if="labelList.length" grid grid-cols-3 gap-6 p-4>
    <div
      v-for="label in labelList"
      :key="label.id"
      rounded-2 p-4 bg-white shadow-lg hover:shadow-xl transition-shadow space-y-2
      @click="viewNote(label.id)"
    >
      <div flex justify-between>
        <div>{{ label.name }}</div>
        <a-tooltip>
          <template #title>
            <span>{{ planList.find(i => i.id == label.planId)!.name }}</span>
          </template>
          <div
            w-3 h-3 rounded-full cursor-pointer mr-1
            :style="{
              backgroundColor: planList.find(i => i.id == label.planId)!.color,
            }"
          />
        </a-tooltip>
      </div>
      <div flex class="group">
        <div>{{ formatHHmm(label.totalTime) }}</div>
        <div flex-1 />
        <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.update') }}</span>
            </template>
            <div i-mdi:file-edit text-5 cursor-pointer @click.stop="handleUpdate(label)" />
          </a-tooltip>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.remove') }}</span>
            </template>
            <div i-mdi:delete text-5 cursor-pointer @click.stop="handleRemove(label)" />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <label-form v-model:visible="labelCreateVisible" v-model:model="labelCreateModel" type="create" @refresh="refresh" />
  <label-form v-model:visible="labelUpdateVisible" type="update" :model="labelUpdateModel" @refresh="refresh" />
</template>
