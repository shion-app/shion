<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'

const props = defineProps<{
  visible: boolean
  page: string | undefined
}>()

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

const content = computed(() => {
  if (props.page == 'chart')
    return `${t('help.chart.step1')}\n\n${t('help.chart.step2')}`
  else if (props.page == 'timeline')
    return `${t('help.timeline.step1')}\n\n${t('help.timeline.step2')}\n\n${t('help.timeline.step3')}`
  else if (props.page == 'manual')
    return `${t('help.manual.step1')}\n\n${t('help.manual.step2')}\n\n${t('help.manual.step3')}`
  else if (props.page == 'automatic')
    return `${t('help.automatic.step1')}\n\n${t('help.automatic.step2')}\n\n${t('help.automatic.step3')}`
  else if (props.page == 'dimension')
    return `${t('help.dimension.step1')}\n\n${t('help.dimension.step2')}`
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="t(`statusBar.help.tooltip.${props.page}`)">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <MdPreview id="preview-only" :model-value="content" />
    </v-card-text>
  </advanced-dialog>
</template>
