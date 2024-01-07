<script setup lang="ts">
import classNames from 'classnames'

const store = useTimerStore()

const { success } = useNotify()
const route = useRoute()

const { running, time, text } = storeToRefs(store)
const { finish } = store

const visibleRoute = ['index', 'timeline', 'list']
const expanded = ref(false)
const toggleExpanded = useToggle(expanded)

const visible = computed(() => running.value && visibleRoute.includes(route.name as string))

async function finishTimer() {
  await finish()
  success({})
}
</script>

<template>
  <div
    :class="classNames(
      expanded ? 'rounded-lg' : 'rounded-full',
      expanded ? 'w-64' : 'w-0',
      {
        'p-2': expanded,
        'elevation-4': expanded,
        'opacity-0': !expanded,
        'h-0': !expanded,
      })"
    transition-width-500 flex bg-white shrink-1 @click="() => toggleExpanded()"
  >
    <div>
      <div text-6>
        {{ text }}
      </div>
      <div font-mono text-4>
        {{ time }}
      </div>
    </div>
    <div flex-1 />
    <v-btn icon="mdi-stop" m-1 @click="finishTimer" />
  </div>
  <v-btn v-if="visible && !expanded" icon="mdi-timer-outline" @click.stop="() => toggleExpanded()" />
</template>
