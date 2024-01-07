<script setup lang="ts">
import { layoutMainProvide, layoutSymbol } from './provide'

const { railWidth, footerHeight, headerHeight } = inject(layoutSymbol)!

const dragged = ref(false)
const toggleDrag = useToggle(dragged)

layoutMainProvide({
  dragged,
  toggleDrag,
})
</script>

<template>
  <main
    absolute right-0 overflow-y-auto
    :style="{
      left: `${railWidth}px`,
      top: `${headerHeight}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </main>
</template>
