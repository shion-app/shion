<script setup lang="ts">
import { type SelectOverview, db } from '@/modules/database'

const list = ref<Array<SelectOverview>>([])

const gridItems = computed(() => list.value.map(({ id, x, y, w, h }) => ({
  id: String(id), x, y, w, h,
})))

async function init() {
  list.value = await db.overview.select()
}

init()
</script>

<template>
  <grid :items="gridItems" :component-props="[]">
    <template #default="{ componentProps }">
      <div v-bind="componentProps">
        123
      </div>
    </template>
  </grid>
</template>
