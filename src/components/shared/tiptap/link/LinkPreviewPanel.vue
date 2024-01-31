<script setup lang="ts">
interface Props {
  url: string
  onEdit: () => void
  onClear: () => void
}

const props = defineProps<Props>()
</script>

<template>
  <v-card>
    <div class="flex items-center gap-2 p-2">
      <a :href="props.url" target="_blank" rel="noopener noreferrer" class="text-sm underline">
        {{ props.url }}
      </a>
      <v-tooltip location="bottom" :text="$t('tiptap.link.edit')">
        <template #activator="{ props: tooltipProps }">
          <v-btn icon variant="text" v-bind="tooltipProps" size="small" @click="props.onEdit">
            <div i-mdi:pencil-outline text-4 />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip location="bottom" :text="$t('tiptap.link.remove')">
        <template #activator="{ props: tooltipProps }">
          <v-btn icon variant="text" v-bind="tooltipProps" size="small" @click="props.onClear">
            <div i-mdi:trash-can-outline text-4 />
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </v-card>
</template>
