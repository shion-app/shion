<script setup lang="ts">
defineProps<{
  tooltip: string
  location?: any
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <v-tooltip :text="$props.tooltip" :location="$props.location">
    <template #activator="{ props }">
      <v-btn
        v-bind="{
          ...props,
          ...$attrs,
        }"
      />
    </template>
  </v-tooltip>
</template>
