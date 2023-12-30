<script setup lang="ts">
import { layoutSymbol } from './provide'

const { sm } = useTailwindBreakpoints()

provide(layoutSymbol, {
  headerHeight: sm.value ? 36 : 48,
  footerHeight: sm.value ? 36 : 70,
  railWidth: sm.value ? 100 : 0,
})
</script>

<template>
  <div h-screen relative>
    <slot />
  </div>
</template>
