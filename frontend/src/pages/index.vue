<script lang="ts" setup>
import type { main } from '../../wailsjs/go/models'
import { EventType } from '../constants'

let list = $ref<main.Record[]>([])
let activeExeList = $ref<Array<string>>([])

const router = useRouter()

async function getList() {
  list = await QueryRecord()
}

getList()

GetActiveExeList().then((list) => {
  activeExeList = list
})

function jump(id: number) {
  router.push(`/record/${id}`)
}

async function deleteRecord(id: number) {
  await DeleteRecord(id)
  removeBy(list, item => item.id === id)
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
    <div flex>
      <v-spacer />
      <insert-record @refresh="getList" />
    </div>
    <v-divider my />
    <div flex-1 overflow-y-auto>
      <div
        v-for="{ id, name, type, exe, totalTime } in list"
        :key="id"
        rounded-2
        border
        m-4
        p-4
        class="group"
        @click="jump(id)"
      >
        <div flex items-center>
          <div>{{ name }}</div>
          <div v-if="exe" :class="programStatus(exe)" ml-2 />
        </div>
        <div flex>
          <div>{{ calculate(totalTime) }}{{ $t('hour') }}</div>
          <v-spacer />
          <div flex op-0 group-hover-op-100 transition-opacity-200>
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
</template>
