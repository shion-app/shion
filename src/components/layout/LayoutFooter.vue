<script setup lang="ts">
import { layoutSymbol } from './provide'

const { footerHeight } = inject(layoutSymbol)!
</script>

<template>
  <footer
    absolute bottom-0 left-0 right-0
    :style="{
      height: `${footerHeight}px`,
    }"
  >
    <slot />
  </footer>
</template>
./provide
