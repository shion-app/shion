<script setup lang="ts">
import type { Label } from '@interfaces/index'
import type { SelectProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  type: 'create' | 'update'
  visible: boolean
  model: Label
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const planOptions = ref<SelectProps['options']>([])

const title = computed(() => props.type == 'create' ? t('label.create') : t('label.update'))
const request = computed(() => props.type == 'create' ? create : update)

function create() {
  const { name, planId } = vModel.value
  return createLabel({
    name,
    planId,
  })
}

function update() {
  const { name, id, planId } = vModel.value
  return updateLabel(id, {
    name,
    planId,
  })
}

async function finish() {
  try {
    await request.value()
  }
  catch (error) {
    message.error(error as string)
    return
  }
  close()
  emit('refresh')
  message.success(t('message.success'))
}

async function init() {
  planOptions.value = (await selectPlan()).map(({ id, name }) => ({
    label: name,
    value: id,
  }))
}

init()
</script>

<template>
  <a-modal v-model:visible="visibleVModel" :title="title" :footer="null">
    <modal-form v-model:model="vModel" @finish="finish" @cancel="close">
      <a-form-item name="name" :label="$t('label.name')" :rules="[{ required: true }]">
        <a-input v-model:value="vModel.name" />
      </a-form-item>
      <a-form-item name="planId" :label="$t('label.plan')" :rules="[{ required: true }]">
        <a-select
          v-model:value="vModel.planId"
          :options="planOptions"
        />
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
