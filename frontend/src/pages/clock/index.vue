<script lang="ts" setup>
import { extractTime } from '../../utils'

import type { main } from '../../../wailsjs/go/models'

let recordList = $ref<main.Record[]>([])
let labelList = $ref<main.Label[]>([])
let activeRecordId = $ref(0)
let activeLabelId = $ref(0)

const selectedRecord = $computed(() => recordList.find(item => item.id === activeRecordId))
const selectedLabel = $computed(() => labelList.find(item => item.id === activeLabelId))

async function getRecordList() {
  recordList = (await QueryRecord({})).filter(({ exe }) => !exe)
}

async function getLabelList() {
  labelList = (await QueryLabel(activeRecordId, {}))
}

getRecordList()

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
  timeId = await InsertTime(activeRecordId, activeLabelId, startTime, endTime)
}

async function finish() {
  isStart = false
  cancelAnimationFrame(frame)
  if (timeId !== 0) {
    await UpdateTime(activeRecordId, timeId, {
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
  activeLabelId = 0
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
        UpdateTime(activeRecordId, timeId, {
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
  activeLabelId = id
}
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
    <div v-if="selectedRecord" absolute m-4 p-4 left-0 bottom-0 rounded-xl flex class="elevation-2">
      <div flex items-center mr-4>
        <div i-mdi:clock text-4 mr-2 />
        <div>{{ selectedRecord.name }}</div>
      </div>
      <div v-if="selectedLabel" flex items-center>
        <div i-mdi:label text-4 mr-2 />
        <div>
          {{ selectedLabel.name }}
        </div>
      </div>
    </div>
  </div>
  <v-menu location="end" transition="slide-x-transition" activator="#extra-menu" min-width="100" offset="20">
    <v-list>
      <v-list-item v-if="!isStart" value="selectRecord">
        {{ $t('clock.selectRecord') }}
        <v-menu location="end" transition="slide-x-transition" activator="parent" min-width="100" max-height="200" offset="20">
          <v-list>
            <v-list-item v-for="{ id, name } in recordList" :key="id" :value="id" :active="activeRecordId === id" @click="selectRecord(id)">
              {{ name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item value="createLabel">
        {{ $t('clock.createLabel') }}
        <insert-label />
      </v-list-item>
      <v-list-item v-if="selectedRecord" value="selectLabel">
        {{ $t('clock.selectLabel') }}
        <v-menu location="end" transition="slide-x-transition" activator="parent" min-width="100" max-height="200" offset="20">
          <v-list>
            <v-list-item v-for="{ id, name } in labelList" :key="id" :value="id" :active="activeLabelId === id" @click="selectLabel(id)">
              {{ name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
