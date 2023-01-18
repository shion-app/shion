<script lang="ts" setup>
const { t } = useI18n()

const { config, write } = useConfig()

const localeList = [{
  key: t('locale.simpChinese'),
  value: 'zh-CN',
}, {
  key: t('locale.english'),
  value: 'en-US',
}]

const list = ['locale', 'autoCheckUpdate']

watch(config, write)
</script>

<template>
  <v-container>
    <v-row v-for="key in list" :key="key">
      <v-col cols="3">
        <div>{{ $t(`config.${key}`) }}</div>
      </v-col>
      <v-col cols="9">
        <v-select v-if="key === 'locale'" v-model="config.locale" variant="solo" :items="localeList" item-title="key" item-value="value" />
        <v-switch v-if="key === 'autoCheckUpdate'" v-model="config.autoCheckUpdate" color="primary" />
      </v-col>
    </v-row>
  </v-container>
</template>
