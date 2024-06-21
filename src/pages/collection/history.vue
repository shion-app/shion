<script setup lang="ts">
import type { GridList } from '@/hooks/useGrid'
import { useGrid } from '@/hooks/useGrid'
import type { SelectDomain } from '@/modules/database'
import { db } from '@/modules/database'

const router = useRouter()
const { onRefresh } = usePageRefresh()
const historyStore = useHistoryStore()

const { pullActiveBrowsers } = historyStore

const list = ref<GridList<SelectDomain>>([])

const { items, wrap, select } = useGrid(list)

const cardList = computed(() => list.value.map(({ id, name, itemCount, color, selected }) => ({
  id,
  title: name,
  itemCount,
  color,
  selected,
})))

async function refresh() {
  list.value = wrap(await db.domain.select())
  await pullActiveBrowsers()
}

async function handleLayoutUpdated(items: number[]) {
  const historyList = items.map((id, index) => {
    const { sort } = list.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => list.value[index].id != i.id)
  if (historyList.length) {
    await db.domain.batchUpdate(historyList)
    await refresh()
  }
}

function navigate(id: number) {
  router.push({
    path: '/timeline',
    query: {
      category: 'history',
      id,
    },
  })
}

onRefresh(refresh)

refresh()
</script>

<template>
  <grid
    v-if="list.length" :items="items" :component-props="cardList" :options="{ cellHeight: 100 }"
    @layout-updated="handleLayoutUpdated"
  >
    <template #default="{ componentProps }">
      <box-card
        v-bind="componentProps" :actions="[]" @update:selected="v => select(componentProps.id, v)"
        @click="navigate(componentProps.id)"
      />
    </template>
  </grid>
  <empty v-else type="history" :desc="$t('hint.history')" :width="300" />
  <status-bar-teleport :xs="false">
    <history-pull />
  </status-bar-teleport>
</template>
