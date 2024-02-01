<script setup lang="ts">
import logo from '@/assets/logo-center.svg?raw'

const logoRef = ref<HTMLElement>()

const eyeRef = ref<HTMLElement>()

const { elementX, elementY, elementWidth, elementHeight, isOutside } = useMouseInElement(logoRef)

const centerX = computed(() => elementWidth.value / 2)
const centerY = computed(() => elementHeight.value / 2)
const x = elementX
const y = computed(() => elementHeight.value - elementY.value)

watchOnce(logoRef, v => eyeRef.value = v?.querySelector('g[filter="url(#filter1_d_55_2)"]') as HTMLElement)

watch([elementX, elementY], () => {
  let translateX = 0
  let translateY = 0
  const radius = 16
  if (isOutside.value) {
    const angle = Math.atan2((y.value - centerY.value), (x.value - centerX.value))
    translateX = Math.cos(angle) * radius
    translateY = -Math.sin(angle) * radius
    if (translateY < 0)
      translateY = 0
  }
  else {
    translateY = -radius
  }
  eyeRef.value?.setAttribute('transform', `translate(${translateX} ${translateY})`)
})
</script>

<template>
  <div ref="logoRef" class="w-[96px] h-[96px]" v-html="logo" />
</template>
