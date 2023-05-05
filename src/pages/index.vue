<script setup lang="ts">
import type { Plan } from '@interfaces/index'
import { Modal, message } from 'ant-design-vue'

const { setMenu } = useMore()
const { t } = useI18n()
const router = useRouter()

const planCreateVisible = ref(false)
const planUpdateVisible = ref(false)
const planModel = ref({} as Plan)
const list = ref<Array<Plan>>([])

async function refresh() {
  list.value = await selectPlan()
}

function handleUpdate(plan: Plan) {
  planUpdateVisible.value = true
  Object.assign(planModel.value, plan)
}

function handleRemove(plan: Plan) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await removePlan(plan.id)
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

function viewNote(planId: number) {
  router.push({
    path: '/note',
    query: {
      planId,
    },
  })
}

setMenu(() => [
  {
    key: 'createPlan',
    title: t('plan.create'),
    click() {
      planCreateVisible.value = true
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
      v-for="plan in list"
      :key="plan.id"
      rounded-2
      p-4
      bg-white
      shadow-lg
      hover:shadow-xl
      transition-shadow
      class="group"
      @click="viewNote(plan.id)"
    >
      <div>{{ plan.name }}</div>
      <div flex>
        <div>{{ formatTime(plan.totalTime) }}</div>
        <div flex-1 />
        <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.update') }}</span>
            </template>
            <div i-mdi:file-edit text-6 cursor-pointer @click.stop="handleUpdate(plan)" />
          </a-tooltip>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.remove') }}</span>
            </template>
            <div i-mdi:delete text-6 cursor-pointer @click.stop="handleRemove(plan)" />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <plan-create v-model:visible="planCreateVisible" @refresh="refresh" />
  <plan-update v-model:visible="planUpdateVisible" :model="planModel" @refresh="refresh" />
</template>
