<script setup lang="ts">
const props = defineProps<{
  id: number
  title: string
  selected: boolean
  totalTime: number
  color: string
  prependImgUrl?: string
}>()

defineEmits<{
  (e: 'update', id: number): void
  (e: 'remove', id: number): void
  (e: 'update:selected', v: boolean): void
}>()

const { selected: selectedVModel } = useVModels(props)

const { formatHHmmss } = useDateFns()
</script>

<template>
  <grid-card v-model:selected="selectedVModel" :title="props.title">
    <template v-if="$props.prependImgUrl" #prepend>
      <img :src="$props.prependImgUrl" width="32" height="32">
    </template>
    <template #append>
      <div
        w-3 h-3 rounded-full my-4.5 mr-3
        :style="{
          backgroundColor: color,
        }"
      />
    </template>
    <template #menu>
      <v-list-item value="button.update" :title="$t('button.update')" @click="$emit('update', $props.id)" />
      <v-list-item value="button.remove" :title="$t('button.remove')" @click="$emit('remove', $props.id)" />
      <slot name="menu" />
    </template>
    <v-card-text class="pb-0!">
      <div>
        {{ formatHHmmss($props.totalTime) }}
      </div>
    </v-card-text>
  </grid-card>
</template>
