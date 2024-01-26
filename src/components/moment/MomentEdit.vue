<script setup lang="ts">
const props = defineProps<{
  title: string
  content: string
}>()

defineEmits(['submit', 'update:title', 'update:content'])

const { title: titleVModel, content: contentVModel } = useVModels(props)
</script>

<template>
  <div h-full flex flex-col>
    <div flex px-4 py-2 items-center>
      <v-text-field
        v-model="titleVModel"
        text-6 variant="plain" :placeholder="$t('moment.inputTitle')"
        hide-details
      />
      <div flex-1 />
      <v-btn color="primary" @click="$emit('submit')">
        {{ $t('moment.submit') }}
      </v-btn>
    </div>
    <tiptap v-model:content="contentVModel" />
  </div>
</template>
