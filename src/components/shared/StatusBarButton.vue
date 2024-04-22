<script setup lang="ts">
withDefaults(defineProps<{
  tooltip: string
  icon?: string
  text: string
  location?: any
  loaderIcon?: string
}>(), {
  location: 'top',
})

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <v-tooltip :text="$props.tooltip" :location="$props.location">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        size="x-small" variant="text" v-bind="{
          ...tooltipProps,
          ...$attrs,
        }"
      >
        <template v-if="$props.icon" #prepend>
          <div :class="$props.icon" text-4 />
        </template>
        <div>{{ $props.text }}</div>
        <template v-if="$props.loaderIcon" #loader>
          <div :class="$props.loaderIcon" text-4 />
        </template>
      </v-btn>
    </template>
  </v-tooltip>
</template>
