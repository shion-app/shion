<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['finish', 'cancel', 'update:visible'])

const model = ref<{
  planId?: number
  labelIdList?: Array<number>
}>({
  planId: undefined,
  labelIdList: [],
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
  labelOptions.value = label.map(({ id, name }) => ({
    label: name,
    value: id,
  }))
}

async function finish() {
  const time = Date.now()
  const { planId, labelIdList } = model.value

  const { lastInsertId: noteId } = await createNote({
    startTime: time,
    endTime: time,
    planId: planId!,
  })
  await relateNoteAndLabel(noteId, labelIdList!)

  close()
  emit('finish', noteId)
}

init()
</script>

<template>
  <a-modal v-model:visible="visibleVModel" :title="$t('note.fill.title')" :footer="null">
    <modal-form :model="model" @finish="finish" @cancel="close">
      <a-form-item name="planId" :label="$t('note.fill.plan')" :rules="[{ required: true }]">
        <a-select
          v-model:value="model.planId"
          :options="planOptions"
        />
      </a-form-item>
      <a-form-item name="labelIdList" :label="$t('note.fill.label')">
        <a-select
          v-model:value="model.labelIdList"
          mode="multiple"
          :options="labelOptions"
        />
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
