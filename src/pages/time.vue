<script setup lang="ts">
const store = useTime()
const { setMenu } = useMore()
const { t } = useI18n()

const { running, time } = storeToRefs(store)
const { start, finish } = store

const planId = ref(0)
const disabled = computed(() => planId.value == 0)

async function create() {
  const time = Date.now()
  const result = await createNote({
    startTime: time,
    endTime: time,
    planId: planId.value,
  })
  start(() => {
    updateNote(result.lastInsertId, {
      endTime: Date.now(),
    })
  })
}

// watchEffect(() => {
//   setMenu([
//     {
//       key: 'selectPlan',
//       title: t('plan.select'),
//       click() {

//       },
//     },
//   ])
// })

// onUnmounted(() => setMenu([]))
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <div font-mono text-20>
      {{ time }}
    </div>
    <a-button v-if="running" shape="circle" @click="finish">
      <template #icon>
        <div i-mdi:stop />
      </template>
    </a-button>
    <a-button v-else :disabled="disabled" shape="circle" @click="create">
      <template #icon>
        <div i-mdi:play />
      </template>
    </a-button>
  </div>
</template>
