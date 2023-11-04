<script setup lang="ts">
import { layoutSymbol } from './provide'

const { railWidth, footerHeight, headerHeight } = inject(layoutSymbol)!
</script>

<template>
  <main
    absolute top-0 right-0 overflow-y-auto
    :style="{
      left: `${railWidth}px`,
      top: `${headerHeight}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </main>
</template>
