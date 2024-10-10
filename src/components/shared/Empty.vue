<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'data' | 'overview' | 'plan' | 'timeline' | 'box' | 'moment' | 'monitor' | 'label' | 'history' | 'search' | 'dimension'
  desc?: string
  width?: number
}>(), {
  type: 'data',
  width: 200,
})

const invisible = ref(true)
const imgUrl = new URL(`../../assets/empty/${props.type}.svg`, import.meta.url).href

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
    <img :width="props.width" :src="imgUrl">
    <div text-5 mt-14 text-gray-500 tracking-wider>
      {{ $props.desc || $t('hint.empty') }}
    </div>
  </div>
</template>
