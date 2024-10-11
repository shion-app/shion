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
        w-3 h-3 rounded-full mr-1 :style="{
          backgroundColor: color,
        }"
      />
    </template>
    <template #menu>
      <v-list-item
        value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline"
        base-color="red" @click="$emit('remove', $props.id)"
      />
      <v-list-item
        value="button.update" :title="$t('button.update')" append-icon="mdi-pencil-outline"
        @click="$emit('update', $props.id)"
      />
      <slot name="menu" />
    </template>
    <template #default="{ isHovering }">
      <v-card-text class="pb-0! pt-4! flex items-center" :class="[isHovering ? 'pr-[50px]!' : '']">
        <div class="shrink-0 mr-4">
          {{ formatHHmmss($props.totalTime) }}
        </div>
        <div class="overflow-hidden whitespace-nowrap">
          <slot name="dimension" />
        </div>
      </v-card-text>
    </template>
  </grid-card>
</template>
