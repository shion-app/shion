<script setup lang="ts">
defineProps<{
  text: string
  icon: string
}>()
</script>

<template>
  <v-tooltip :text="$props.text" location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="{
          ...props,
          ...$attrs,
        }" :icon="$props.icon" variant="text"
      />
    </template>
  </v-tooltip>
</template>
