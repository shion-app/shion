import { emit } from 'process';
<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue'

const props = defineProps<{
  title: string
  content: string
}>()

defineEmits(['submit', 'update:title', 'update:content'])

const { title: titleVModel, content: contentVModel } = useVModels(props)
</script>

<template>
  <div h-full flex flex-col>
    <div flex px-6 py-2 items-center>
      <a-input
        v-model:value="titleVModel" :placeholder="$t('moment.inputTitle')" size="large"
        class="w-[500px]! border-0! p-0! bg-transparent! border-transparent! shadow-none! text-6! rounded-none!"
      />
      <div flex-1 />
      <a-button type="primary" @click="$emit('submit')">
        {{ $t('moment.submit') }}
      </a-button>
    </div>
    <MilkdownProvider>
      <MilkdownEditor v-model:content="contentVModel" />
    </MilkdownProvider>
  </div>
</template>
