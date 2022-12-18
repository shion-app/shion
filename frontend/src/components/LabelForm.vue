<script  lang="ts" setup>
import type { main } from '../../wailsjs/go/models'
import type { RawLabel } from '../interfaces'

const emit = defineEmits<{
  (event: 'submit', data: RawLabel): void
}>()

const { t } = useI18n()

const form = $ref<any>()
let isShow = $ref(false)
let list = $ref<main.Record[]>([])

const name = $ref('')
const nameRules = [v => !!v || t('input.required')]
const record = $ref({ id: 0, name: '' })
const recordRules = [v => !!v.name || t('input.required')]

async function getList() {
  list = await QueryRecord({})
}

getList()

function close() {
  isShow = false
}

async function confirm() {
  const { valid } = await form.validate()
  if (valid) {
    close()
    emit('submit', {
      name,
      recordId: record.id,
    })
  }
}
</script>

<template>
  <v-dialog v-model="isShow" width="500" activator="parent">
    <v-card>
      <v-card-title> {{ $t('clock.createLabel') }} </v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="name"
            variant="solo"
            :label="$t('time.prop.name')"
            :rules="nameRules"
          />
          <v-select
            v-model="record"
            return-object
            variant="solo"
            :items="list"
            item-title="name"
            item-value="id"
            :label="t('time.prop.record')"
            :rules="recordRules"
          />
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
  </v-dialog>
</template>
