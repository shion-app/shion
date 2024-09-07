<script setup lang="ts">
import WordHighlighter from 'vue-word-highlighter'
import type { SelectRemark } from '@/modules/database'
import { db } from '@/modules/database'
import type { StepCounter } from '@/utils'

const props = defineProps<{
  keyword: string
  searched: boolean
}>()

interface SearchItem {
  time: number
  title: string
  desc: string
  navigate: Function
}

const { keyword: keywordVModel } = useVModels(props)
const { format, formatYYYYmmdd } = useDateFns()

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

function deduplicateRemark(list: Array<SelectRemark>, counter: StepCounter) {
  return list.map(item => ({
    ...item,
    time: counter.get(item.time),
  }))
}

async function handleSearch(keyword: string, page: number, size: number) {
  const { list, count } = (await db.remark.paginationSelect({
    keyword,
    page,
    size,
  }))
  const counter = randomStep(list.map(i => i.time))
  return {
    list: deduplicateRemark(list, counter).map(i => ({
      time: i.time,
      title: i.title,
      desc: i.desc,
      navigate: () => {

      },
    })),
    count,
  }
}

async function onPageChange({ currentPage, currentPageSize }: { currentPage: number; currentPageSize: number }) {
  if (!keywordVModel.value)
    return

  const { list, count } = await handleSearch(keywordVModel.value, currentPage, currentPageSize)
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

defineExpose({
  search,
})
</script>

<template>
  <v-tabs-window-item value="remark">
    <v-list v-if="data.size" ref="scrollContainer">
      <template v-for="[date, list] in data" :key="date">
        <v-list-subheader sticky>
          {{ formatYYYYmmdd(new Date(date)) }}
        </v-list-subheader>
        <template v-for="{ time, desc, title, navigate } in list" :key="time">
          <v-list-item :value="time" @click="() => navigate()">
            <div flex>
              <div class="w-[100px]" shrink-0>
                {{ format(time, 'HH:mm') }}
              </div>
              <WordHighlighter :query="keyword">
                <div space-y-2>
                  <div>{{ title }}</div>
                  <div>{{ desc }}</div>
                </div>
              </WordHighlighter>
            </div>
          </v-list-item>
          <v-divider my-2 />
        </template>
      </template>
      <div v-if="isLastPage" text-center py-2 text-gray-500>
        {{ $t('search.tip.done') }}
      </div>
    </v-list>
    <empty
      v-else type="search" :width="200" my-8
      :desc="keywordVModel && props.searched ? $t('search.tip.empty') : $t('search.tip.input')"
    />
  </v-tabs-window-item>
</template>
