<script setup lang="ts">
import { layoutSymbol } from './provide'

const { xs, sm } = useTailwindBreakpoints()

provide(layoutSymbol, {
  headerHeight: 36,
  footerHeight: 36,
  railWidth: sm.value ? 100 : 0,
})
</script>

<template>
  <div h-screen relative>
    <slot />
  </div>
</template>
