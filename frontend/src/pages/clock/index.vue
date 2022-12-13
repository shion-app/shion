<script lang="ts" setup>
import { extractTime } from '../../utils'

import type { main } from '../../../wailsjs/go/models'

let list = $ref<main.Record[]>([])
let activeId = $ref<number>()

const selected = $computed(() => list.find(item => item.id === activeId))

async function getList() {
  list = (await QueryRecord({})).filter(({ exe }) => !exe)
}

getList()

let isStart = $ref(false)
const startDisabled = $computed(() => typeof activeId !== 'number')

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
  timeId = await InsertTime(activeId!, startTime, endTime)
}

async function finish() {
  isStart = false
  cancelAnimationFrame(frame)
  await UpdateTime(activeId!, timeId, {
    end: endTime,
  })
  reset()
}

function reset() {
  startTime = endTime = 0
  clock = formatTime(0)
  currentTime = 0
  activeId = undefined
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
        UpdateTime(activeId!, timeId, {
          end: endTime,
        })
      }
    }
    clock = formatTime(endTime - startTime)
    count()
  })
}

function select(id: number) {
  activeId = id
}
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full>
    <div font-mono text-20>
      {{ clock }}
    </div>
    <v-btn v-if="isStart" elevation="8" icon size="80" @click="finish">
      <div i-mdi:stop text-16 />
    </v-btn>
    <v-btn v-else elevation="8" icon size="80" :disabled="startDisabled" @click="start">
      <div i-mdi:play text-16 />
    </v-btn>
  </div>
  <v-menu location="end" transition="slide-x-transition" activator="#extra-menu" min-width="100" offset="20">
    <v-list>
      <v-list-item v-if="!isStart" :disabled="isStart" value="select">
        {{ $t('clock.select') }}
        <v-menu location="end" transition="slide-x-transition" activator="parent" min-width="100" max-height="200" offset="20">
          <v-list>
            <v-list-item v-for="{ id, name } in list" :key="id" :value="id" :active="activeId === id" @click="select(id)">
              {{ name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item v-else-if="selected" disabled value="progress">
        {{ $t('clock.progress', {
          name: selected?.name,
        }) }}
      </v-list-item>
    </v-list>
  </v-menu>
</template>
