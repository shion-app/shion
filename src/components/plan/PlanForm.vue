<script setup lang="ts">
import { message } from 'ant-design-vue'
import { db } from '@modules/database'
import type { DatabaseError, SelectPlan } from '@modules/database'

const props = defineProps<{
  type: 'create' | 'update'
  visible: boolean
  model: SelectPlan
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const isCreate = computed(() => props.type == 'create')
const title = computed(() => isCreate.value ? t('plan.create') : t('plan.update'))
const request = computed(() => isCreate.value ? create : update)

function create() {
  const { name, color } = vModel.value
  return db.plan.insert({
    name,
    color,
  })
}

function update() {
  const { name, id, color } = vModel.value
  return db.plan.update(id, {
    name,
    color,
  })
}

async function finish() {
  try {
    await request.value()
  }
  catch (error) {
    // TODO: message
    return message.error((error as DatabaseError).message)
  }
  close()
  emit('refresh')
  message.success(t('message.success'))
}

whenever(() => visibleVModel.value && isCreate.value, () => {
  vModel.value.color = randomColor()
})
</script>

<template>
  <a-modal v-model:visible="visibleVModel" :title="title" :footer="null">
    <modal-form v-model:model="vModel" @finish="finish" @cancel="close">
      <a-form-item name="name" :label="$t('plan.name')" :rules="[{ required: true }]">
        <a-input v-model:value="vModel.name" />
      </a-form-item>
      <a-form-item name="color" :label="$t('plan.color')" :rules="[{ required: true }]">
        <input v-model="vModel.color" type="color">
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
