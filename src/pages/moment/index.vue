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

function update(id: number) {
  router.push(`/moment/update/${id}`)
}

init()
</script>

<template>
  <div h-full>
    <template v-if="list.length">
      <div
        v-for="{ title, time, id } in list" :key="id"
        flex cursor-pointer px-20 py-4 hover:bg-gray-300 bg-transparent transition
        class="group"
        @click="viewDetail(id)"
      >
        <div>{{ title }}</div>
        <div flex-1 />
        <div mr-6>
          {{ isThisYear(time) ? format(time, 'MM-dd') : format(time, 'yyyy-MM-dd') }}
        </div>
        <a-dropdown>
          <div text-6 i-mdi:dots-vertical op-0 group-hover-op-100 transition-opacity-400 />
          <template #overlay>
            <a-menu>
              <a-menu-item @click="update(id)">
                {{ $t('moment.edit') }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </template>
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
