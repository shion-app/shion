<script lang="ts" setup>
import type * as backend from '@interfaces/backend'

const store = useMonitor()
const { filtering, filterList, whiteList } = storeToRefs(store)

async function handleCreateProgram(program: backend.Program) {
  const { description, path } = program
  const index = filterList.value.findIndex(i => i.path == path)
  filterList.value.splice(index, 1)
  const { lastInsertId } = await createProgram({
    description,
    path,
  })
  whiteList.value.unshift({
    description,
    id: lastInsertId,
    path,
  })
}
</script>

<template>
  <a-switch v-model:checked="filtering" />
  <div flex>
    <div>
      <div v-for="program in filterList" :key="program.path" p-4>
        <div flex>
          <div>
            <div>{{ program.path }}</div>
            <div>{{ program.description }}</div>
          </div>
          <div i-mdi:add text-6 @click="handleCreateProgram(program)" />
        </div>
      </div>
    </div>
    <div>
      <div v-for="{ path, description } in whiteList" :key="path" p-4>
        <div>{{ path }}</div>
        <div>{{ description }}</div>
      </div>
    </div>
  </div>
</template>
