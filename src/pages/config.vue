<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const store = useConfig()

const { config } = storeToRefs(store)

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
  <div h-full px-30 py-8>
    <a-form
      :label-col="{
        style: {
          width: '100px',
        },
      }"
      :wrapper-col="{
        style: {
          alignItems: 'flex-end',
        },
      }" label-align="left" :colon="false"
    >
      <a-form-item
        :label="$t('config.locale')"
      >
        <a-select
          v-model:value="config.locale"
          :style="{
            width: '250px',
          }"
          :options="localeOptions"
        />
      </a-form-item>
      <a-form-item
        :label="$t('config.checkUpdate')"
      >
        <a-switch v-model:checked="config.checkUpdate" />
      </a-form-item>
    </a-form>
  </div>
</template>
