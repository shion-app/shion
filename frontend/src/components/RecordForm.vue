<script lang="ts" setup>
import type { RawRecord } from '../interfaces'

const {
  title,
  data = {
    name: '',
    type: RecordType.MANUAL,
    exe: '',
  },
} = defineProps<{
  title: string
  data?: RawRecord
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', data: RawRecord): void
}>()

interface Select {
  key: string
  value: number
}

const { t } = useI18n()

const selectList: Select[] = [
  {
    key: t('record.prop.manual'),
    value: RecordType.MANUAL,
  },
  {
    key: t('record.prop.auto'),
    value: RecordType.AUTO,
  },
]

const form = $ref<any>()
const name = $ref(data.name)
const type = $ref(selectList.find(item => item.value === data.type)!)
let exe = $ref(data.exe)
let isValidExe = $ref(true)
let isLoading = $ref(false)

const required = v => !!v || t('input.required')
const nameRules = [required]
const invalidExe = () => isValidExe || t('record.tip.invalidExe')
const exeRules = [required, invalidExe]

function close() {
  emit('close')
}

async function confirm() {
  const { valid } = await form.validate()
  if (valid) {
    emit('submit', {
      name,
      type: type.value,
      exe,
    })
  }
}

async function openFileDialog() {
  const path = await GetExecutablePath()
  if (path) {
    isLoading = true
    await waitProcess(async () => {
      if (data.exe !== path)
        isValidExe = await CheckExecutablePath(path)
    }, 1000)
    isLoading = false
    exe = path
  }
}

watch(
  () => type.value,
  (newVal) => {
    if (newVal === RecordType.MANUAL) {
      exe = ''
      isValidExe = false
    }
  },
)
</script>

<template>
  <v-card>
    <v-card-title> {{ title }} </v-card-title>
    <v-card-text>
      <v-form ref="form">
        <v-text-field
          v-model="name"
          variant="solo"
          :label="$t('record.prop.name')"
          :rules="nameRules"
        />
        <v-select
          v-model="type"
          return-object
          variant="solo"
          :items="selectList"
          item-title="key"
          item-value="value"
          :label="t('record.prop.type')"
        />
        <v-text-field
          v-if="type.value === RecordType.AUTO"
          v-model="exe"
          variant="solo"
          :rules="exeRules"
          :label="$t('record.prop.exe')"
          readonly
          @click="openFileDialog"
        >
          <template #append-inner>
            <v-fade-transition mode="out-in">
              <v-progress-circular
                v-if="isLoading"
                color="info"
                indeterminate
                size="24"
                width="3"
              />
              <template v-else>
                <template v-if="exe">
                  <div
                    v-if="isValidExe"
                    i-mdi:check-circle
                    c-green
                    text-6
                  />
                  <div v-else i-mdi:close-circle c-red text-6 />
                </template>
                <div v-else w-6 h-6 />
              </template>
            </v-fade-transition>
          </template>
        </v-text-field>
      </v-form>
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <div flex-grow />
      <v-btn color="primary" text @click="confirm">
        {{ $t("dialog.confirm") }}
      </v-btn>
      <v-btn color="error" text @click="close">
        {{ $t("dialog.cancel") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
