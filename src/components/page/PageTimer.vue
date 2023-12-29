<script setup lang="ts">
const store = useTimerStore()

const { success } = useNotify()
const { xs, sm } = useTailwindBreakpoints()

const { running, time, text } = storeToRefs(store)
const { finish } = store

const { open } = useNoteCreate()

async function finishTimer() {
  await finish()
  success({})
}
</script>

<template>
  <div v-if="sm" flex flex-col items-center justify-evenly m-a h-full relative>
    <div font-mono text-20>
      {{ time }}
    </div>
    <div
      shadow-lg hover:shadow-xl transition-shadow w-20 h-20 rounded-full cursor-pointer text-12 flex justify-center
      items-center bg-white
      @click="() => {
        running ? finishTimer() : open()
      }"
    >
      <div :class="running ? 'i-mdi:stop' : 'i-mdi:play'" />
    </div>
  </div>
  <div v-if="xs && running" flex absolute bottom-0 left-0 right-0 px-6 py-2 items-center>
    <v-btn icon="mdi-stop" size="small" @click="finishTimer" />
    <div flex-1 />
    <div>
      <div text-6>
        {{ text }}
      </div>
      <div font-mono>
        {{ time }}
      </div>
    </div>
  </div>
</template>
