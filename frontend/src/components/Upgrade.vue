<script lang="ts" setup>
const { confirm } = useDialog()
const { t } = useI18n()

let size = $ref(0)
let total = $ref(0)
let isShow = $ref(false)

EventsOn(EventType.CAN_UPGRADE, async (version: string) => {
  const ok = await confirm({
    title: t('dialog.tip'),
    content: t('upgrade.tip', {
      version,
    }),
    width: 300,
  })
  if (ok) {
    EventsEmit(EventType.UPGRADE)
    isShow = true
  }
})

EventsOn(EventType.UPGRADING, (s: number, t: number) => {
  size = s
  total = t
})

function format(num: number) {
  return parseInt(String(num)) === num ? num : num.toFixed(2)
}

function fileSize(size: number) {
  const KB = 1 << 10
  const MB = 1 << 20
  const GB = 1 << 30
  if (size >= GB)
    return `${format(size / GB)}GB`
  else if (size >= MB)
    return `${format(size / MB)}MB`
  else if (size >= KB)
    return `${format(size / KB)}KB`
  else
    return `${size}B`
}
</script>

<template>
  <v-dialog v-model="isShow" width="400" persistent>
    <v-card>
      <v-card-title>
        {{ t('upgrade.upgrading') }}
      </v-card-title>
      <v-card-text>
        <v-progress-linear :model-value="100 * size / total" :height="10" />
        <div flex m-t-2>
          <div flex-1 />
          <div>{{ fileSize(size) }} / {{ fileSize(total) }}</div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
