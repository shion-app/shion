<script setup lang="ts">
import type { Plan } from '@interfaces/index'
import { Modal, message } from 'ant-design-vue'

const { setMenu } = useMore()
const { t } = useI18n()
const router = useRouter()

const planCreateVisible = ref(false)
const planUpdateVisible = ref(false)
const planCreateModel = ref({
  name: '',
  color: '',
} as Plan)
const planUpdateModel = ref({} as Plan)
const list = ref<Array<Plan>>([])

async function refresh() {
  list.value = await selectPlan()
}

function handleUpdate(plan: Plan) {
  planUpdateVisible.value = true
  Object.assign(planUpdateModel.value, plan)
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
      space-y-2
      @click="viewNote(plan.id)"
    >
      <div flex justify-between>
        <div>{{ plan.name }}</div>
        <div
          w-3 h-3 rounded-full mr-1
          :style="{
            backgroundColor: plan.color,
          }"
        />
      </div>
      <div flex class="group">
        <div>{{ formatHHmm(plan.totalTime) }}</div>
        <div flex-1 />
        <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.update') }}</span>
            </template>
            <div i-mdi:file-edit text-5 cursor-pointer @click.stop="handleUpdate(plan)" />
          </a-tooltip>
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('button.remove') }}</span>
            </template>
            <div i-mdi:delete text-5 cursor-pointer @click.stop="handleRemove(plan)" />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <plan-form v-model:visible="planCreateVisible" v-model:model="planCreateModel" type="create" @refresh="refresh" />
  <plan-form v-model:visible="planUpdateVisible" type="update" :model="planUpdateModel" @refresh="refresh" />
</template>
