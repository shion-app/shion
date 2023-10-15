<script setup lang="ts">
import type { SelectMoment } from '@modules/database'
import { db } from '@modules/database'
import { isThisYear } from 'date-fns'

const { setMenu } = useMore()
const { t } = useI18n()
const router = useRouter()

const list = ref<Array<SelectMoment>>([])

setMenu(() => [
  {
    key: 'createMoment',
    title: t('moment.create'),
    click() {
      router.push('/moment/create')
    },
  },
])

async function init() {
  list.value = await db.moment.select()
}

function viewDetail(id: number) {
  router.push(`/moment/detail/${id}`)
}

init()
</script>

<template>
  <div>
    <div
      v-for="{ title, time, id } in list" :key="id"
      flex cursor-pointer px-20 py-4 hover:bg-gray-300 bg-transparent transition
      @click="viewDetail(id)"
    >
      <div>{{ title }}</div>
      <div flex-1 />
      <div>{{ isThisYear(time) ? format(time, 'MM-dd') : format(time, 'yyyy-MM-dd') }}</div>
    </div>
  </div>
</template>
