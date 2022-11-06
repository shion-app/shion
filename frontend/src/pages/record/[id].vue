<script lang="ts" setup>
import type { main } from '../../../wailsjs/go/models'
import { EventType } from '../../constants'

const { id } = defineProps<{ id: string }>()

let list = $ref<main.Time[]>()

async function getList() {
  list = await QueryTime(Number(id))
}

getList()

let isStart = $ref(false)

let startTime = 0
let endTime = 0
let clock = $ref(formatTime(0))

let frame: number

function start() {
  isStart = true
  startTime = Date.now()
  count()
}

async function finish() {
  isStart = false
  cancelAnimationFrame(frame)
  await InsertTime(Number(id), startTime, endTime)
  startTime = endTime = 0
  clock = formatTime(0)
  await getList()
}

function complement(num: number) {
  return num < 10 ? `0${num}` : num
}

function formatTime(time: number) {
  const milli = complement(~~((time % 1000) / 10))
  time = ~~(time / 1000)
  const second = complement(time % 60)
  time = ~~(time / 60)
  const minute = complement(time % 60)
  const hour = ~~(time / 60)
  const result = `${minute}:${second}.${milli}`
  return hour ? `${complement(hour)}:${result}` : result
}

function count() {
  frame = requestAnimationFrame(() => {
    endTime = Date.now()
    clock = formatTime(endTime - startTime)
    count()
  })
}

// TODO:关闭应用自动保存
EventsOn(EventType.CLOSE_WATCH, finish)
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
