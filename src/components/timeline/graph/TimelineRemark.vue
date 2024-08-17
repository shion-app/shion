<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import type { TimeLineNodeCommonGraphData } from '@/interfaces'
import type { SelectRemark } from '@/modules/database'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: SelectRemark
}>()

defineOptions({
  inheritAttrs: false,
})

const notify = useNotify()
const { t } = useI18n()

async function openWith() {
  notify.info({
    text: t('timelineGraph.remark.wait'),
  })
  await invoke('open_with_detached', {
    path: props.raw.program.path,
    arg: props.raw.arg,
  })
}
</script>

<template>
  <div v-bind="$attrs" i-mdi:map-marker cursor-pointer @click="openWith">
    <v-tooltip activator="parent" :text="$t('timelineGraph.remark.tooltip')" location="start" />
  </div>
  <div>
    <div :class="props.data.children ? 'line-clamp-2' : 'line-clamp-1'" break-all>
      {{ props.data.title }}
    </div>
    <div>
      {{ props.raw.desc }}
    </div>
  </div>
</template>
