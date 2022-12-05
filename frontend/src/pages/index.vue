<script lang="ts" setup>
import type { main } from '../../wailsjs/go/models'

import svg from '../assets/void.svg'

const router = useRouter()
const { confirm, message } = useDialog()
const { t } = useI18n()

let list = $ref<main.Record[]>([])
let activeExeList = $ref<Array<string>>([])

async function getList() {
  list = await QueryRecord()
}

getList()

GetActiveExeList().then((list) => {
  activeExeList = list
})

function viewRecord(id: number) {
  router.push(`/record/${id}`)
}

async function deleteRecord(id: number) {
  const ok = await confirm({
    title: t('dialog.tip'),
    content: t('dialog.confirmDelete'),
    width: 300,
  })
  if (ok) {
    const process = DeleteRecord(id)
    await message.loading({
      process,
    })
    removeBy(list, item => item.id === id)
  }
}

function calculate(time: number) {
  const hour = (time / (1000 * 60 * 60)).toFixed(1)
  return hour
}

EventsOn(EventType.ACTIVE_EXE, (list) => {
  activeExeList = list
})

function programStatus(exe: string) {
  const className = 'rounded-full w-2 h-2'
  const color = activeExeList.includes(exe) ? 'bg-green' : 'bg-gray'
  return `${className} ${color}`
}
</script>

<template>
  <div flex flex-col h-full>
    <div flex-1 overflow-y-auto>
      <empty v-if="!list.length">
        <img :src="svg" alt="void">
      </empty>
      <div
        v-else
        grid
        class="grid-col"
      >
        <div
          v-for="{ id, name, type, exe, totalTime } in list"
          :key="id"
          rounded-2
          m-4
          p-4
          class="group elevation-2"
          @click="viewRecord(id)"
        >
          <div flex items-center mb-2>
            <div>{{ name }}</div>
            <div v-if="exe" :class="programStatus(exe)" ml-2 />
          </div>
          <div flex>
            <div>{{ calculate(totalTime) }}{{ $t('hour') }}</div>
            <div flex-grow />
            <div flex op-0 group-hover-op-100 transition-opacity-400>
              <update-record :id="id" :data="{ name, type, exe }" @refresh="getList" />
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:delete text-6 cursor-pointer v-bind="props" @click.stop="deleteRecord(id)" />
                </template>
                <span>{{ $t("input.delete") }}</span>
              </v-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <v-menu location="end" transition="slide-x-transition" activator="#extra-menu" min-width="100" offset="20">
    <v-list>
      <v-list-item value="add">
        {{ $t("input.add") }}
        <insert-record @refresh="getList" />
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style lang="scss" scoped>
.grid-col {
  grid-template-columns: repeat(2, 1fr);
  @media(min-width: 1000px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media(min-width: 1500px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
