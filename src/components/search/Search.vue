<script setup lang="ts">
import type { ComponentExposed } from 'vue-component-type-helpers'

import SearchHistory from './SearchHistory.vue'
import SearchMoment from './SearchMoment.vue'
import SearchRemark from './SearchRemark.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'scrollTo', time: number): void
  (e: 'update:visible'): void
}>()

const { visible: visibleVModel } = useVModels(props)

useHotkey('ctrl+f', () => {
  visibleVModel.value = true
})

const keyword = ref('')
const tab = ref('general')
const searched = ref(false)

const searchRef = useRefList<ComponentExposed<typeof SearchHistory | typeof SearchMoment | typeof SearchRemark>>()

const searchList = ['history', 'moment', 'remark']

function getComponent(name: string) {
  switch (name) {
    case 'history':
      return SearchHistory
    case 'moment':
      return SearchMoment
    case 'remark':
      return SearchRemark
  }
}

function search() {
  searched.value = true
  for (const component of searchRef.value)
    component.search()
}

function scrollTo(time: number) {
  visibleVModel.value = false
  emit('scrollTo', time)
}

watch(keyword, (v) => {
  searchRef.value.clear()
  if (v.length == 0)
    searched.value = false
})

watch(visibleVModel, (v) => {
  if (!v) {
    setTimeout(() => {
      keyword.value = ''
    }, 200)
  }
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :card="false" class="sm:w-[700px]">
    <v-text-field
      v-model="keyword" append-inner-icon="mdi-magnify" autofocus @click:append-inner="search"
      @keydown.enter="search"
    />
    <v-card>
      <v-card-text>
        <v-tabs v-model="tab" color="primary">
          <v-tab prepend-icon="mdi-web" :text="$t('search.tab.history')" value="history" />
          <v-tab prepend-icon="mdi-pencil" :text="$t('search.tab.moment')" value="moment" />
          <v-tab prepend-icon="mdi-map-marker" :text="$t('search.tab.remark')" value="remark" />
        </v-tabs>
        <v-tabs-window v-model="tab" class="h-[350px] pt-0! overflow-y-auto!">
          <component
            :is="getComponent(name)" v-for="name in searchList" :key="name" :ref="searchRef.set"
            :keyword="keyword" :searched="searched"
            @scroll-to="scrollTo"
          />
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </advanced-dialog>
</template>
