<script setup lang="ts">
const { sm } = useTailwindBreakpoints()

const dragged = ref(false)
const isGrid = ref(false)
const toggleDrag = useToggle(dragged)
const toggleIsGrid = useToggle(isGrid)

layoutProvide({
  headerHeight: sm.value ? 36 : 48,
  footerHeight: sm.value ? 36 : 54,
  railWidth: sm.value ? 100 : 0,
  dragged,
  toggleDrag,
  isGrid,
  toggleIsGrid,
})
</script>

<template>
  <div h-screen relative>
    <slot />
  </div>
</template>
