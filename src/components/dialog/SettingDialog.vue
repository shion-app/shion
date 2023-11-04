<script setup lang="ts">
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
  <v-dialog activator="parent" width="500">
    <v-card>
      <v-card-title>{{ $t('titleBar.view.setting') }}</v-card-title>
      <v-card-text>
        <v-list lines="two">
          <v-list-item>
            <v-list-item-title>{{ $t('config.locale') }}</v-list-item-title>
            <template #append>
              <v-list-item-action>
                <v-select
                  v-model="config.locale"
                  :items="localeOptions"
                  hide-details
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
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
