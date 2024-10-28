<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const announcementStore = useAnnouncementStore()

const { announcement } = storeToRefs(announcementStore)

const { format } = useDateFns()
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.announcement.message')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <div v-if="announcement.date">
        <div text-5 font-bold>
          {{ announcement.title }}
        </div>
        <div text-gray>
          {{ format(announcement.date, 'PPpp') }}
        </div>
        <MdPreview id="preview-only" :model-value="announcement.content" />
      </div>
      <empty v-else />
    </v-card-text>
  </advanced-dialog>
</template>
