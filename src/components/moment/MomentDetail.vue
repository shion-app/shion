<script setup lang="ts">
import type { SelectMoment } from '@/modules/database'

const props = defineProps<{
  moment: SelectMoment
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const { formatYYYYmmdd } = useDateFns()
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel">
    <v-card-text>
      <div flex items-end>
        <div text-6>
          {{ props.moment.title }}
        </div>
        <div flex-1 />
        <div text-gray>
          {{ $t('moment.createdAt', {
            date: formatYYYYmmdd(moment.createdAt, true),
          }) }}
        </div>
      </div>
      <tiptap :content="props.moment.content" :editable="false" content-class="h-[400px]" />
    </v-card-text>
  </advanced-dialog>
</template>
