<script setup lang="ts">
import WordHighlighter from 'vue-word-highlighter'

const props = defineProps<{
  keyword: string
  searched: boolean
}>()

interface SearchItem {
  time: number
  content: string
  navigate: Function
}

const { keyword: keywordVModel } = useVModels(props)
const { format, formatYYYYmmdd } = useDateFns()
const { search: searchObsidian } = useObsidian()

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
  searchResult.value = (await searchObsidian(keywordVModel.value)).map(({ metadata, matched }) => ({
    time: metadata.created,
    content: matched,
    navigate: () => {

    },
  })).sort((a, b) => b.time - a.time)
}

defineExpose({
  search,
})
</script>

<template>
  <v-tabs-window-item value="moment">
    <v-list v-if="data.size">
      <template v-for="[date, list] in data" :key="date">
        <v-list-subheader sticky>
          {{ formatYYYYmmdd(new Date(date)) }}
        </v-list-subheader>
        <template v-for="{ time, content, navigate } in list" :key="time">
          <v-list-item :value="time" @click="() => navigate()">
            <div flex>
              <div class="w-[100px]" shrink-0>
                {{ format(time, 'HH:mm') }}
              </div>
              <WordHighlighter :query="keyword">
                {{ content }}
              </WordHighlighter>
            </div>
          </v-list-item>
          <v-divider my-2 />
        </template>
      </template>
      <div text-center py-2 text-gray-500>
        {{ $t('search.tip.done') }}
      </div>
    </v-list>
    <empty
      v-else type="search" :width="200" my-8
      :desc="keywordVModel && props.searched ? $t('search.tip.empty') : $t('search.tip.input')"
    />
  </v-tabs-window-item>
</template>
