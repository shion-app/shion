<script setup lang="ts">
import { layoutSymbol } from './provide'

const { railWidth, footerHeight } = inject(layoutSymbol)!
</script>

<template>
  <main
    absolute top-0 right-0
    :style="{
      left: `${railWidth}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </main>
</template>
./provide
