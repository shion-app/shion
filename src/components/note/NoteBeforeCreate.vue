<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
  form?: {
    planId: number
    labelId: number
  }
}>()

const emit = defineEmits(['finish', 'cancel', 'update:visible'])

const model = ref<{
  planId?: number
  labelId?: number
  countdown: boolean
  time: number
}>({
  planId: undefined,
  labelId: undefined,
  countdown: false,
  time: 1,
})

const { visible: visibleVModel } = useVModels(props)

const { close } = useFormDialog(visibleVModel, model)

const planOptions = ref<SelectProps['options']>([])
const labelOptions = ref<SelectProps['options']>([])

async function init() {
  const [plan, label] = await Promise.all([selectPlan(), selectLabel()])
  planOptions.value = plan.map(({ id, name }) => ({
    label: name,
    value: id,
  }))
  watch(() => model.value.planId, (v) => {
    labelOptions.value = label.filter(i => i.planId == v).map(({ id, name }) => ({
      label: name,
      value: id,
    }))
  })
}

async function finish() {
  const now = Date.now()
  const { planId, labelId, countdown, time } = model.value

  const { lastInsertId: noteId } = await createNote({
    startTime: now,
    endTime: now,
    planId: planId!,
    labelId: labelId!,
  })

  close()
  emit('finish', {
    noteId,
    countdown,
    time: time * 1000 * 60,
  })
}

function handlePlanChange() {
  model.value.labelId = undefined
}

watch(() => props.form, (v) => {
  Object.assign(model.value, v)
}, {
  deep: true,
})

init()
</script>

<template>
  <a-modal v-model:visible="visibleVModel" :title="$t('note.fill.title')" :footer="null">
    <modal-form :model="model" @finish="finish" @cancel="close">
      <a-form-item name="planId" :label="$t('note.fill.plan')" :rules="[{ required: true }]">
        <a-select
          v-model:value="model.planId"
          :options="planOptions"
          @change="handlePlanChange"
        />
      </a-form-item>
      <a-form-item name="labelId" :label="$t('note.fill.label')" :rules="[{ required: true }]">
        <a-select
          v-model:value="model.labelId"
          :options="labelOptions"
        />
      </a-form-item>
      <a-form-item name="countdown" :label="$t('note.fill.countdown')">
        <a-switch v-model:checked="model.countdown" />
      </a-form-item>
      <a-form-item v-if="model.countdown" name="time" :label="$t('note.fill.time')">
        <a-input-number v-model:value="model.time" :min="1" :precision="0" :addon-after="$t('time.minute')" />
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
