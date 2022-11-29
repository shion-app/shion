<script lang="ts" setup>
import { extractTime } from '../../utils'

import type { main } from '../../../wailsjs/go/models'

let list = $ref<main.Record[]>([])

async function getList() {
  list = (await QueryRecord()).filter(({ exe }) => !exe)
}

getList()

// const { id } = defineProps<{ id: string }>()

let id: number

let isStart = $ref(false)

let startTime = 0
let endTime = 0
let clock = $ref(formatTime(0))

let frame: number

let timeId: number
let currentTime = 0

function start() {
  isStart = true
  // startTime = Date.now()
  // insert()
  // count()
}

async function insert() {
  endTime = startTime
  timeId = await InsertTime(id, startTime, endTime)
}

async function finish() {
  isStart = false
  // cancelAnimationFrame(frame)
  // await UpdateTime(id, timeId, {
  //   end: endTime,
  // })
  // reset()
}

function reset() {
  startTime = endTime = 0
  clock = formatTime(0)
  currentTime = 0
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
      if (typeof timeId === 'number') {
        UpdateTime(Number(id), timeId, {
          end: endTime,
        })
      }
    }
    clock = formatTime(endTime - startTime)
    count()
  })
}
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full>
    <div font-mono text-20>
      {{ clock }}
    </div>
    <v-btn v-if="isStart" icon size="80" @click="finish">
      <div i-mdi:stop text-16 />
    </v-btn>
    <v-btn v-else icon size="80" @click="start">
      <div i-mdi:play text-16 />
    </v-btn>
  </div>
</template>
