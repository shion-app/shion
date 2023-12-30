<script setup lang="ts">
import img from '@/assets/no-data.svg'

defineProps<{
  desc?: string
}>()

const invisible = ref(true)

setTimeout(() => {
  invisible.value = false
}, 100)
</script>

<template>
  <div
    h-full flex flex-col justify-center items-center :class="{
      invisible,
    }"
  >
    <img width="200" :src="img">
    <div text-5 mt-10 text-gray-500>
      {{ $props.desc || $t('hint.empty') }}
    </div>
  </div>
</template>
