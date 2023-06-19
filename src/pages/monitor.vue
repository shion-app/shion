<script lang="ts" setup>
import type * as backend from '@interfaces/backend'

const store = useMonitor()
const { filtering, filterList, whiteList, iconMap } = storeToRefs(store)

async function handleCreateProgram(program: backend.Program) {
  const { description, path, icon } = program
  const index = filterList.value.findIndex(i => i.path == path)
  filterList.value.splice(index, 1)
  const { lastInsertId } = await createProgram({
    description,
    path,
    icon,
  })
  whiteList.value.unshift({
    description,
    id: lastInsertId,
    path,
    icon,
  })
}

async function handleRemoveProgram(id: number) {
  const index = whiteList.value.findIndex(i => i.id == id)
  whiteList.value.splice(index, 1)
  removeProgram(id)
}
</script>

<template>
  <a-switch v-model:checked="filtering" />
  <div flex class="h-[calc(100%-30px)] [&>*]:w-50% [&>*]:h-full">
    <div>
      <template v-if="filterList.length">
        <div v-for="program in filterList" :key="program.path" p-4 flex space-x-4>
          <img :src="iconMap.get(program.path)" width="32" height="32" object-contain>
          <div flex-1 min-w-0>
            <div truncate>
              {{ program.path }}
            </div>
            <div>{{ program.description }}</div>
          </div>
          <div i-mdi:add text-6 cursor-pointer flex-shrink-0 @click="handleCreateProgram(program)" />
        </div>
      </template>
      <template v-else>
        <a-empty h-full flex flex-col justify-center />
      </template>
    </div>
    <div>
      <template v-if="whiteList.length">
        <div v-for="{ path, description, id } in whiteList" :key="id" p-4 flex space-x-4>
          <img :src="iconMap.get(path)" width="32" height="32" object-contain>
          <div flex-1 min-w-0>
            <div truncate>
              {{ path }}
            </div>
            <div>{{ description }}</div>
          </div>
          <div i-mdi:remove text-6 cursor-pointer @click="handleRemoveProgram(id)" />
        </div>
      </template>
      <template v-else>
        <a-empty h-full flex flex-col justify-center />
      </template>
    </div>
  </div>
</template>
