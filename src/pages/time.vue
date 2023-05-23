<script setup lang="ts">
import { message } from 'ant-design-vue'

const store = useTime()
const { t } = useI18n()

const { running, time, isCountdownOver, countdown } = storeToRefs(store)
const { start, finish } = store

const visible = ref(false)

async function create({
  noteId,
  countdown,
  time,
}: { noteId: number
  countdown: boolean
  time: number
}) {
  start(countdown,
    time, () => updateNote(noteId, {
      endTime: Date.now(),
    }))
}

function openModal() {
  visible.value = true
}

async function finishTimer() {
  await finish()
  message.success(t('message.success'))
}
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <div
      font-mono text-20 :class="{
        'text-red-6': countdown && !isCountdownOver,
        'text-green-6': countdown && isCountdownOver,
      }"
    >
      {{ time }}
    </div>
    <div
      shadow-lg hover:shadow-xl transition-shadow w-20 h-20 rounded-full cursor-pointer text-12 flex justify-center items-center bg-white
    >
      <div v-if="running" i-mdi:stop @click="finishTimer" />
      <div v-else i-mdi:play @click="openModal" />
    </div>
  </div>
  <note-before-create v-model:visible="visible" @finish="create" />
</template>
