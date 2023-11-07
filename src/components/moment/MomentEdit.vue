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
      <v-text-field
        v-model="titleVModel" variant="plain" :placeholder="$t('moment.inputTitle')"
      />
      <div flex-1 />
      <v-btn color="primary" @click="$emit('submit')">
        {{ $t('moment.submit') }}
      </v-btn>
    </div>
    <MilkdownProvider>
      <MilkdownEditor v-model:content="contentVModel" />
    </MilkdownProvider>
  </div>
</template>
