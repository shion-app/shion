<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const store = useExtensionStore()

const { config } = storeToRefs(store)

const { t } = useI18n()

const tab = ref('dandanplay')

async function openFileDialog() {
  const selected = await open({
    filters: [
      {
        name: t('filePicker.name'),
        extensions: ['exe'],
      },
    ],
  })
  if (selected)
    config.value.dandanplaypath = selected.path
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.extension')" class="w-[700px]!">
    <v-card-text class="h-[400px] flex">
      <v-tabs v-model="tab" color="primary" direction="vertical" class="w-[130px] py-2">
        <v-tab :text="$t('extension.tab.dandanplay')" value="dandanplay" />
      </v-tabs>

      <v-tabs-window v-model="tab" class="overflow-y-auto!" w-full>
        <v-tabs-window-item value="dandanplay">
          <v-card flat>
            <v-card-text class="py-0!">
              <v-list lines="two">
                <v-list-item :title="$t('extension.dandanplay.port')">
                  <template #append>
                    <v-number-input
                      v-model="config.dandanplayPort" hide-details variant="outlined" reverse
                      density="comfortable" class="w-[200px]" control-variant="stacked" :min="0"
                    />
                  </template>
                </v-list-item>
                <v-list-item :title="$t('extension.dandanplay.path')">
                  <v-text-field
                    class="w-full py-2" :model-value="config.dandanplaypath" hide-details readonly
                    density="comfortable" variant="outlined" :placeholder="$t('extension.desc.dandanplay')"
                    @click="openFileDialog"
                  >
                    <v-tooltip
                      v-if="config.dandanplaypath" :text="config.dandanplaypath" location="bottom"
                      activator="parent"
                    />
                  </v-text-field>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </advanced-dialog>
</template>
