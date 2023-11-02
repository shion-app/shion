<script setup lang="ts">
const store = useTimerStore()

const { success } = useNotify()

const { running, time } = storeToRefs(store)
const { finish } = store

const { openModal } = useNoteCreate()

async function finishTimer() {
  await finish()
  success({})
}
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <div
      font-mono text-20
    >
      {{ time }}
    </div>
    <div
      shadow-lg hover:shadow-xl transition-shadow w-20 h-20 rounded-full cursor-pointer text-12 flex justify-center items-center bg-white
      @click="() => {
        running ? finishTimer() : openModal()
      }"
    >
      <div :class="running ? 'i-mdi:stop' : 'i-mdi:play'" />
    </div>
  </div>
</template>
