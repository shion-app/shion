<script setup lang="ts">
defineProps<{
  title: string
  totalTime: number
  color: string
  prependImgUrl?: string
}>()
</script>

<template>
  <v-card
    :title="$props.title"
  >
    <template v-if="$props.prependImgUrl" #prepend>
      <img :src="$props.prependImgUrl">
    </template>
    <template #append>
      <div
        w-3 h-3 rounded-full
        :style="{
          backgroundColor: color,
        }"
      />
    </template>
    <v-card-text>
      {{ formatHHmmss($props.totalTime) }}
    </v-card-text>
  </v-card>
</template>
