<script setup lang="ts">
import { FaviconService } from '@/modules/favicon'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const store = useConfigStore()

const { config } = storeToRefs(store)

const { autostart, runAsAdmin } = useAutostart()
const { t } = useI18n()

const tab = ref('general')

const localeOptions = [
  {
    title: '简体中文',
    value: 'zh-CN',
  },
  {
    title: 'English (United States)',
    value: 'en-US',
  },
]

const colorModeOptions = computed(() => [
  {
    title: t('config.appearance.colorMode.light'),
    value: ColorMode.Light,
  },
  {
    title: t('config.appearance.colorMode.dark'),
    value: ColorMode.Dark,
  },
  {
    title: t('config.appearance.colorMode.auto'),
    value: ColorMode.Auto,
  },
])
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.setting')" class="w-[700px]!">
    <v-card-text class="h-[400px] flex">
      <v-tabs v-model="tab" color="primary" direction="vertical" class="w-[130px] py-2">
        <v-tab prepend-icon="mdi-cog" :text="$t('config.tab.general')" value="general" />
        <v-tab prepend-icon="mdi-export" :text="$t('config.tab.export')" value="export" />
        <v-tab prepend-icon="mdi-hand-back-right" :text="$t('config.tab.behavior')" value="behavior" />
        <v-tab prepend-icon="mdi-api" :text="$t('config.tab.service')" value="service" />
        <v-tab prepend-icon="mdi-palette" :text="$t('config.tab.appearance')" value="appearance" />
      </v-tabs>

      <v-tabs-window v-model="tab" class="overflow-y-auto!" w-full>
        <v-tabs-window-item value="appearance">
          <v-card flat>
            <v-card-text class="py-0!">
              <v-list lines="two">
                <v-list-item :title="$t('config.themeColor')">
                  <template #append>
                    <color-picker-button v-model="config.themeColor" />
                  </template>
                </v-list-item>
                <v-list-item :title="$t('config.colorMode')">
                  <template #append>
                    <v-select
                      v-model="config.colorMode" :items="colorModeOptions" hide-details class="w-[230px]"
                      color="primary"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-tabs-window-item>

        <v-tabs-window-item value="general">
          <v-card flat>
            <v-card-text class="py-0!">
              <v-list lines="two">
                <v-list-item>
                  <v-list-item-title>{{ $t('config.locale') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action>
                      <v-select
                        v-model="config.locale" :items="localeOptions" hide-details class="w-[230px]"
                        color="primary"
                      />
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>{{ $t('config.checkUpdate') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action>
                      <v-checkbox-btn v-model="config.checkUpdate" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>{{ $t('config.autostart') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action>
                      <v-checkbox-btn v-model="autostart" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item :disabled="!autostart">
                  <v-list-item-title>
                    <div flex items-center space-x-1>
                      <div>{{ $t('config.runAsAdmin') }}</div>
                      <div i-mdi:information text-4>
                        <v-tooltip activator="parent" :text="$t('config.tooltip.runAsAdmin')" />
                      </div>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('config.desc.runAsAdmin') }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-list-item-action>
                      <v-checkbox-btn v-model="runAsAdmin" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>{{ $t('config.launchVisible') }}</v-list-item-title>
                  <template #append>
                    <v-list-item-action>
                      <v-checkbox-btn v-model="config.launchVisible" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-tabs-window-item>

        <v-tabs-window-item value="behavior">
          <v-card flat>
            <v-card-text class="py-0!">
              <v-list lines="two">
                <v-list-subheader>{{ $t('config.header.timeline') }}</v-list-subheader>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('config.timelineMinMinute') }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('config.desc.timelineMinMinute') }}
                  </v-list-item-subtitle>
                  <v-slider
                    v-model="config.timelineMinMinute" px-4 py-2 thumb-label hide-details :min="0" :max="10"
                    :step="1" @touchmove.stop
                  />
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('config.timelineGroupGapMinute') }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('config.desc.timelineGroupGapMinute') }}
                  </v-list-item-subtitle>
                  <v-slider
                    v-model="config.timelineGroupGapMinute" px-4 py-2 thumb-label hide-details :min="5"
                    :max="60" :step="5" @touchmove.stop
                  />
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('config.faviconService') }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('config.desc.faviconService') }}
                  </v-list-item-subtitle>
                  <v-radio-group v-model="config.faviconService" hide-details>
                    <v-radio label="Google" :value="FaviconService.Google" />
                    <v-radio label="Icon Horse" :value="FaviconService.IconHorse" />
                  </v-radio-group>
                </v-list-item>
                <v-divider />
                <v-list-subheader>{{ $t('config.header.monitor') }}</v-list-subheader>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('config.watcherWhitelist') }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('config.desc.watcherWhitelist') }}
                  </v-list-item-subtitle>
                  <watcher-whitelist v-model="config.watcherWhitelist" px-1 />
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-tabs-window-item>

        <scheduled-export />

        <api-service />
      </v-tabs-window>
    </v-card-text>
  </advanced-dialog>
</template>
