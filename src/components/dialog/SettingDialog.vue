<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const store = useConfigStore()

const { config } = storeToRefs(store)

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
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.setting')">
    <v-card-text>
      <v-list lines="two">
        <v-list-subheader>{{ $t('config.header.general') }}</v-list-subheader>
        <v-list-item>
          <v-list-item-title>{{ $t('config.locale') }}</v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-select
                v-model="config.locale"
                :items="localeOptions"
                hide-details
                class="w-[200px]"
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
              <v-checkbox-btn v-model="config.autostart" />
            </v-list-item-action>
          </template>
        </v-list-item>
        <v-divider />
        <v-list-subheader>{{ $t('config.header.behavior') }}</v-list-subheader>
        <v-list-item>
          <v-list-item-title>{{ $t('config.timelineMinMinute') }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ $t('config.desc.timelineMinMinute') }}
          </v-list-item-subtitle>
          <template #append>
            <v-list-item-action>
              <v-slider v-model="config.timelineMinMinute" class="w-[200px]" thumb-label hide-details :min="0" :max="10" :step="1" />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </advanced-dialog>
</template>
