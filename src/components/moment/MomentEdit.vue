<script setup lang="ts">
import { type SelectBox, type SelectMoment, db } from '@/modules/database'

const props = withDefaults(defineProps<{
  title?: string
  content?: string
  boxId?: number
  visible: boolean
}>(), {
  title: '',
  content: '',
})

const emit = defineEmits<{
  (event: 'update:title', v: string): void
  (event: 'update:content', v: string): void
  (event: 'update:visible', v: boolean): void
  (event: 'submit', v: SubmitValue): void
}>()

type SubmitValue = Pick<SelectMoment, 'title' | 'content' | 'boxId'>

const { visible: visibleVModel } = useVModels(props)

const form = ref()
const state = reactive({
  title: props.title,
  content: props.content,
  boxId: props.boxId,
})

const boxList = ref<Array<SelectBox>>([])

const boxOptions = computed(() => boxList.value.map(i => ({
  title: i.name,
  value: i.id,
})))

async function handleSubmit() {
  const { valid } = await form.value.validate()
  if (!valid)
    return

  emit('submit', {
    title: state.title,
    content: state.content,
    boxId: state.boxId as number,
  })
}

function handleCancel() {
  visibleVModel.value = false
}

function reset() {
  Object.assign(state, {
    title: '',
    content: '',
    boxId: undefined,
  })
}

async function init() {
  boxList.value = await db.box.select()
}

init()

watchDeep(() => props, (v) => {
  for (const key in v) {
    if (Object.hasOwn(state, key))
      state[key] = v[key]
  }
})

watch(visibleVModel, (v) => {
  if (!v)
    reset()
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :persistent="true" class="sm:w-[800px]">
    <v-card-text>
      <v-form ref="form" validate-on="submit">
        <div flex items-center>
          <v-text-field
            v-model="state.title"
            text-6 variant="plain" :placeholder="$t('moment.inputTitle')"
            mr-6
            :rules="[value => {
              if (value?.length > 0) return true
              return $t('moment.tip.required')
            }]"
          />
          <div class="w-[180px]">
            <v-select
              v-model="state.boxId"
              density="comfortable"
              :items="boxOptions"
              :label="$t('moment.boxLabel')"
              :rules="[value => {
                if (typeof value == 'number') return true
                return $t('moment.tip.required')
              }]"
            />
          </div>
        </div>
      </v-form>
      <tiptap v-model:content="state.content" :editable="true" content-class="h-[300px]" />
    </v-card-text>
    <v-card-actions>
      <div flex-1 />
      <v-btn color="red" @click="handleCancel">
        {{ $t('modal.cancel') }}
      </v-btn>
      <v-btn
        color="primary"
        @click="handleSubmit"
      >
        {{ $t('modal.submit') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
