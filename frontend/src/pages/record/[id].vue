<script lang="ts" setup>
import type { main } from '../../../wailsjs/go/models'
import { extractTime } from '../../utils'

const { id } = defineProps<{ id: string }>()

let list = $ref<main.Time[]>([])

async function getList() {
  list = await QueryTime(Number(id))
}

getList()

let isStart = $ref(false)

let startTime = 0
let endTime = 0
let clock = $ref(formatTime(0))

let frame: number

let timeId: number
let currentTime = 0

function start() {
  isStart = true
  startTime = Date.now()
  insert()
  count()
}

async function insert() {
  endTime = startTime
  timeId = await InsertTime(Number(id), startTime, endTime)
}

async function finish() {
  isStart = false
  cancelAnimationFrame(frame)
  await UpdateTime(Number(id), timeId, {
    end: endTime,
  })
  reset()
  await getList()
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
  <calendar-graph :list="list" />
  <div>{{ clock }}</div>
  <button v-show="!isStart" btn bg-green @click="start">
    {{ $t('start') }}
  </button>
  <button v-show="isStart" btn bg-red @click="finish">
    {{ $t('finish') }}
  </button>
  <div v-for="{ id, start, end } in list" :key="id">
    {{ new Date(start) }} - {{ new Date(end) }}
  </div>
</template>
