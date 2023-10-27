<script setup lang="ts">
import { layoutSymbol } from './provide'

const { railWidth, footerHeight } = inject(layoutSymbol)!
</script>

<template>
  <nav
    absolute
    top-0
    left-0
    :style="{
      width: `${railWidth}px`,
      bottom: `${footerHeight}px`,
    }"
  >
    <slot />
  </nav>
</template>
./provide
