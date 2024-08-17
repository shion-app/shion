<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'

const store = useConfigStore()

const { t } = useI18n()

const { config } = storeToRefs(store)

const count = ref(1)
const span = ref<'day' | 'week' | 'month'>('week')

const periodOptions = computed(() => [
  {
    title: t('config.export.period.day'),
    value: 'day',
  },
  {
    title: t('config.export.period.week'),
    value: 'week',
  },
  {
    title: t('config.export.period.month'),
    value: 'month',
  },
])

async function openDirectoryDialog() {
  const selected = await open({
    directory: true,
  })
  if (selected)
    config.value.scheduledExportPath = selected
}

function transformDuration(duration: number) {
  const day = calcDuration(1, 'day')
  const week = calcDuration(1, 'week')
  const month = calcDuration(1, 'month')
  if (duration >= month) {
    return {
      count: duration / month, span: 'month' as const,
    }
  }

  if (duration >= week) {
    return {
      count: duration / week, span: 'week' as const,
    }
  }

  return {
    count: duration / day, span: 'day' as const,
  }
}

watch([count, span], ([c, s]) => {
  if (typeof c == 'number' && !isNaN(c))
    config.value.scheduledExportPeriod = calcDuration(c, s)
})

watch(() => config.value.scheduledExport, (v) => {
  if (!v)
    config.value.scheduledExportPath = ''
})

function init() {
  const { count: c, span: s } = transformDuration(config.value.scheduledExportPeriod)
  count.value = c
  span.value = s
}

init()
</script>

<template>
  <v-tabs-window-item value="export">
    <v-card flat>
      <v-card-text class="py-0!">
        <v-list lines="two">
          <v-list-item>
            <v-list-item-title>{{ $t('config.scheduledExport') }}</v-list-item-title>
            <template #append>
              <v-list-item-action>
                <v-checkbox-btn v-model="config.scheduledExport" />
              </v-list-item-action>
            </template>
          </v-list-item>
          <template v-if="config.scheduledExport">
            <v-list-item>
              <v-list-item-title>{{ $t('config.scheduledExportPath') }}</v-list-item-title>
              <v-text-field
                class="w-full py-2" :model-value="config.scheduledExportPath" hide-details readonly
                density="comfortable" variant="outlined" :placeholder="$t('config.desc.scheduledExportPath')"
                @click="openDirectoryDialog"
              >
                <v-tooltip
                  v-if="config.scheduledExportPath" :text="config.scheduledExportPath" location="bottom"
                  activator="parent"
                />
              </v-text-field>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>{{ $t('config.scheduledExportPeriod') }}</v-list-item-title>
              <div flex py-2 space-x-4>
                <v-number-input
                  v-model="count" hide-details variant="outlined" reverse control-variant="stacked"
                  density="comfortable" :min="1"
                />
                <v-select
                  v-model="span" :items="periodOptions" hide-details color="primary" variant="outlined"
                  density="comfortable"
                />
              </div>
            </v-list-item>
          </template>
        </v-list>
      </v-card-text>
    </v-card>
  </v-tabs-window-item>
</template>
