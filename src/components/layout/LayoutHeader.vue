<script setup lang="ts">
import { layoutSymbol } from './provide'

const { headerHeight } = inject(layoutSymbol)!
</script>

<template>
  <header
    absolute bottom-0 left-0 right-0 top-0
    :style="{
      height: `${headerHeight}px`,
    }"
  >
    <slot />
  </header>
</template>
