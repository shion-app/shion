<script setup lang="ts">
import WordHighlighter from 'vue-word-highlighter'

const props = defineProps<{
  visible: boolean
  search: (keyword: string, page: number, size: number) => Promise<{
    list: Array<SearchItem>
    count: number
  }>
}>()

interface SearchItem {
  time: number
  content: string
  navigate: Function
}

const { visible: visibleVModel } = useVModels(props)
const { format, formatYYYYmmdd } = useDateFns()

useHotkey('ctrl+f', () => {
  visibleVModel.value = true
})

const keyword = ref('')
const searchResult = ref<Array<SearchItem>>([])
const scrollContainer = ref()
const total = ref(0)

const { arrivedState } = useScroll(scrollContainer, {
  offset: { bottom: 30 },
  throttle: 60,
  onScroll,
})

const { currentPage, currentPageSize, next, isLastPage } = useOffsetPagination({
  total,
  page: 1,
  pageSize: 100,
  onPageChange,
})

const data = computed(() => {
  const map = new Map<string, Array<SearchItem>>()
  for (const item of searchResult.value) {
    const date = format(item.time, 'yyyy-MM-dd')
    map.set(date, [...(map.get(date) || []), item])
  }
  return map
})

async function onPageChange({ currentPage, currentPageSize }: { currentPage: number; currentPageSize: number }) {
  if (!keyword.value)
    return

  const { list, count } = await props.search(keyword.value, currentPage, currentPageSize)
  total.value = count

  if (currentPage == 1)
    searchResult.value = list

  else
    searchResult.value.push(...list)
}

async function search() {
  if (currentPage.value == 1) {
    onPageChange({
      currentPage: 1,
      currentPageSize: currentPageSize.value,
    })
  }
  else {
    currentPage.value = 1
  }
}

function onScroll() {
  const { bottom } = arrivedState
  if (bottom)
    next()
}

watch(keyword, () => {
  searchResult.value = []
})

watch(visibleVModel, (v) => {
  if (!v)
    keyword.value = ''
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :card="false" class="sm:w-[700px]">
    <v-text-field
      v-model="keyword" append-inner-icon="mdi-magnify" @click:append-inner="search"
      @keydown.enter="search"
    />
    <v-card>
      <v-card-text>
        <v-list v-if="data.size" ref="scrollContainer" class="sm:max-h-[450px] pt-0!" overflow-y-auto>
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
          <div v-if="isLastPage" text-center py-2 text-gray-500>
            {{ $t('search.done') }}
          </div>
        </v-list>
        <empty v-else type="search" :width="250" my-8 />
      </v-card-text>
    </v-card>
  </advanced-dialog>
</template>
