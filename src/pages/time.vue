<script setup lang="ts">
import { message } from 'ant-design-vue'

import { db } from '@modules/database'

const store = useTime()
const { t } = useI18n()

const { running } = storeToRefs(store)
const { start, finish } = store

const visible = ref(false)

async function create({
  noteId,
  countdown,
  time,
}: {
  noteId: number
  countdown: boolean
  time: number
}) {
  start(countdown, time, () => db.note.update(noteId, {
    end: Date.now(),
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
    <display text-20 />
    <div
      shadow-lg hover:shadow-xl transition-shadow w-20 h-20 rounded-full cursor-pointer text-12 flex justify-center items-center bg-white
      @click="() => {
        running ? finishTimer() : openModal()
      }"
    >
      <div :class="running ? 'i-mdi:stop' : 'i-mdi:play'" />
    </div>
  </div>
  <note-before-create v-model:visible="visible" @finish="create" />
</template>
