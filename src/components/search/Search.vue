<script setup lang="ts">
import WordHighlighter from 'vue-word-highlighter'

const props = defineProps<{
  visible: boolean
  search: (keyword: string) => Promise<Array<SearchItem>>
}>()

interface SearchItem {
  time: number
  content: string
}

const { visible: visibleVModel } = useVModels(props)
const { format, formatYYYYmmdd } = useDateFns()

const keyword = ref('')
const searchResult = ref<Array<SearchItem>>([])
const data = computed(() => {
  const map = new Map<string, Array<SearchItem>>()
  for (const item of searchResult.value) {
    const date = format(item.time, 'yyyy-MM-dd')
    map.set(date, [...(map.get(date) || []), item])
  }
  return map
})

async function search() {
  if (!keyword.value) {
    searchResult.value = []
    return
  }
  searchResult.value = await props.search(keyword.value)
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :card="false">
    <v-text-field
      v-model="keyword" append-inner-icon="mdi-magnify" @click:append-inner="search"
      @keydown.enter="search"
    />
    <v-card>
      <v-card-text>
        <v-list v-if="data.size" class="sm:max-h-[450px] pt-0!" overflow-y-auto>
          <template v-for="[date, list] in data" :key="date">
            <v-list-subheader sticky>
              {{ formatYYYYmmdd(new Date(date)) }}
            </v-list-subheader>
            <v-list-item v-for="{ time, content } in list" :key="time">
              <v-list-item-title>
                <WordHighlighter :query="keyword">
                  {{ content }}
                </WordHighlighter>
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
        <empty v-else type="search" :width="250" my-8 />
      </v-card-text>
    </v-card>
  </advanced-dialog>
</template>
