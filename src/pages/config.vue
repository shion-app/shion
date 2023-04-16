<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const { locale } = useI18n()
const config = useConfig()

watch(() => config.value.locale, v => locale.value = v)

const localeOptions: SelectProps['options'] = [
  {
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    label: 'English (United States)',
    value: 'en-US',
  },
]
</script>

<template>
  <a-form
    :model="config"
    layout="vertical"
  >
    <a-form-item
      :label="$t('config.locale')"
    >
      <a-select
        v-model:value="config.locale"
        :options="localeOptions"
      />
    </a-form-item>
  </a-form>
</template>
