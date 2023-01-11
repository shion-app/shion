<script lang="ts" setup>
import { extractTime } from '../../utils'

import type { main } from '../../../wailsjs/go/models'

const route = useRoute()

const routeMatched = $computed(() => route.name === 'clock')

let recordList = $ref<main.Record[]>([])
let labelList = $ref<main.Label[]>([])
let activeRecordId = $ref(0)
let activeLabelIdList = $ref<Array<number>>([])

const selectedRecord = $computed(() => recordList.find(item => item.id === activeRecordId))
const selectedLabelList = $computed(() => labelList.filter(item => activeLabelIdList.includes(item.id)))

async function getRecordList() {
  recordList = (await QueryAllRecord()).filter(({ exe }) => !exe)
}

async function getLabelList() {
  labelList = (await QueryAllLabelByRecordID(activeRecordId))
}

onActivated(getRecordList)

let isStart = $ref(false)
const startDisabled = $computed(() => activeRecordId === 0)

let startTime = 0
let endTime = 0
let clock = $ref(formatTime(0))

let frame: number

let timeId = 0
let currentTime = 0

function start() {
  isStart = true
  startTime = Date.now()
  insert()
  count()
}

async function insert() {
  endTime = startTime
  timeId = await InsertTime(activeRecordId, activeLabelIdList, startTime, endTime)
}

async function finish() {
  isStart = false
  cancelAnimationFrame(frame)
  if (timeId !== 0) {
    await UpdateTime(timeId, {
      end: endTime,
    })
  }
  reset()
}

function reset() {
  startTime = endTime = 0
  clock = formatTime(0)
  currentTime = 0
  activeRecordId = 0
  activeLabelIdList = []
  timeId = 0
}

function complement(num: number) {
  return num < 10 ? `0${num}` : num
}

function formatTime(time: number) {
  const { milli, second, minute, hour } = extractTime(time)
  const _milli = complement(~~(milli / 10))
  const _second = complement(second)
  const _minute = complement(minute)
  const result = `${_minute}:${_second}.${_milli}`
  return hour ? `${complement(hour)}:${result}` : result
}

function count() {
  frame = requestAnimationFrame(() => {
    endTime = Date.now()
    if (endTime - currentTime > 1000 * 60) {
      currentTime = endTime
      if (timeId !== 0) {
        UpdateTime(timeId, {
          end: endTime,
        })
      }
    }
    clock = formatTime(endTime - startTime)
    count()
  })
}

function selectRecord(id: number) {
  activeRecordId = id
  getLabelList()
}

function selectLabel(id: number) {
  if (activeLabelIdList.includes(id))
    remove(activeLabelIdList, id)
  else
    activeLabelIdList.push(id)
}
</script>

<script lang="ts">
export default defineComponent({
  name: 'Clock',
})
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <div font-mono text-20>
      {{ clock }}
    </div>
    <v-btn v-if="isStart" elevation="8" icon size="80" @click="finish">
      <div i-mdi:stop text-16 />
    </v-btn>
    <v-btn v-else elevation="8" icon size="80" :disabled="startDisabled" @click="start">
      <div i-mdi:play text-16 />
    </v-btn>
    <div v-if="selectedRecord" absolute m-4 p-4 left-0 bottom-0 rounded-xl flex space-x-4 class="elevation-2">
      <div flex items-center>
        <div i-mdi:clock text-4 mr-2 />
        <div>{{ selectedRecord.name }}</div>
      </div>
      <div v-for="{ name, id } in selectedLabelList" :key="id" flex items-center>
        <div i-mdi:label text-4 mr-2 />
        <div>
          {{ name }}
        </div>
      </div>
    </div>
  </div>
  <v-menu v-if="routeMatched" location="end" transition="slide-x-transition" activator="#extra-menu" min-width="100" offset="20" eager>
    <v-list>
      <v-list-item v-if="!isStart" value="selectRecord" :active="false">
        {{ $t('clock.selectRecord') }}
        <v-menu location="end" transition="slide-x-transition" activator="parent" min-width="100" max-height="200" offset="20">
          <v-list>
            <v-list-item v-for="{ id, name } in recordList" :key="id" :value="id" :active="activeRecordId === id" @click="selectRecord(id)">
              {{ name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item value="createLabel" :active="false">
        {{ $t('clock.createLabel') }}
        <!-- TODO: 单独点击dialog menu不会关闭 -->
        <insert-label />
      </v-list-item>
      <v-list-item v-if="selectedRecord" value="selectLabel" :active="false">
        {{ $t('clock.selectLabel') }}
        <v-menu location="end" transition="slide-x-transition" activator="parent" min-width="100" max-height="200" offset="20">
          <v-list>
            <v-list-item v-for="{ id, name } in labelList" :key="id" :value="id" :active="activeLabelIdList.includes(id)" @click="selectLabel(id)">
              {{ name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
