<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue'

import type * as backend from '@interfaces/backend'
import { type SelectProgram, db } from '@modules/database'

const store = useMonitor()
const { setMenu } = useMore()

const { t } = useI18n()

const { getIconUrl, refresh } = store
const { filtering, filterList, whiteList } = storeToRefs(store)

const formVisible = ref(false)
const formModel = ref({
  name: '',
  color: randomColor(),
} as SelectProgram)

async function handleCreateProgram(program: backend.Program) {
  const { name, path, icon } = program
  const color = randomColor()
  const index = filterList.value.findIndex(i => i.path == path)
  filterList.value.splice(index, 1)
  await db.program.insert({
    name,
    path,
    icon,
    color,
  })
}

async function handleSelect() {
  await Promise.all(filterList.value.filter(i => i.checked).map(handleCreateProgram))
  filtering.value = false
  await refresh()
  message.success(t('message.success'))
}

async function handleRemove(program: SelectProgram) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await db.program.removeRelation(program.id)
      await refresh()
      message.success(t('message.success'))
    },
  })
}

function handleUpdate(program: SelectProgram) {
  formVisible.value = true
  Object.assign(formModel.value, program)
}

setMenu(() => [
  {
    key: 'filterProgram',
    title: t('monitor.filterProgram'),
    click() {
      filtering.value = true
    },
  },
])

refresh()
</script>

<template>
  <div h-full>
    <div v-if="whiteList.length" grid grid-cols-3 gap-6 p-4>
      <div
        v-for="program in whiteList" :key="program.id"
        p-4 flex space-x-4 items-center
        rounded-2
        bg-white
        shadow-lg
        hover:shadow-xl
        transition-shadow
      >
        <img :src="getIconUrl(program.path)" width="32" height="32" object-contain>
        <div flex-1 min-w-0 space-y-2>
          <div flex justify-between>
            <div :title="program.path">
              {{ program.name }}
            </div>
            <div
              w-3 h-3 rounded-full mr-1
              :style="{
                backgroundColor: program.color,
              }"
            />
          </div>
          <div flex class="group">
            <div>{{ formatHHmmss(program.totalTime) }}</div>
            <div flex-1 />
            <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.update') }}</span>
                </template>
                <div i-mdi:file-edit-outline text-5 cursor-pointer @click.stop="handleUpdate(program)" />
              </a-tooltip>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.remove') }}</span>
                </template>
                <div i-mdi:delete-outline text-5 cursor-pointer @click.stop="handleRemove(program)" />
              </a-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a-empty v-else h-full flex flex-col justify-center />
    <a-modal
      v-model:visible="filtering" :title="$t('monitor.filterProgram')" :body-style="{
        height: '300px',
        overflow: 'auto',
      }" @ok="handleSelect"
    >
      <template v-if="filterList.length">
        <div v-for="program in filterList" :key="program.path" flex items-center space-x-4>
          <a-checkbox v-model:checked="program.checked" />
          <div
            flex-1 min-w-0
            p-4 flex space-x-4 items-center
            mb-4
            rounded-2
            bg-white
            shadow-lg
            hover:shadow-xl
            transition-shadow
          >
            <img :src="getIconUrl(program.path)" width="32" height="32" object-contain>
            <div flex-1 min-w-0>
              <div>
                {{ program.name }}
              </div>
              <div truncate :title="program.path">
                {{ program.path }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <a-empty h-full flex flex-col justify-center :description="$t('monitor.switchWindowTip')" />
      </template>
    </a-modal>
    <program-form v-model:visible="formVisible" v-model:model="formModel" @refresh="refresh" />
  </div>
</template>
