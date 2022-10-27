<script lang="ts" setup>
let show = $ref(false);
let form = $ref<any>();
let name = $ref("");

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { t } = useI18n();

const nameRules = [(v) => !!v || t("inputRequired")];

function toggle() {
  show = !show;
}

async function confirm() {
  const { valid } = await form.validate();
  if (valid) {
    await InsertRecord(name, 0, "");
    form.reset()
    toggle()
    emit('refresh')
  }
}
</script>

<template>
  <v-dialog v-model="show" width="500">
    <template v-slot:activator>
      <v-btn color="green" prepend-icon="i-mdi:plus" @click="toggle">
        {{ $t("add") }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title> {{ $t("add") }} </v-card-title>

      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="name"
            :rules="nameRules"
            :label="$t('name')"
            required
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="confirm">
          {{ $t("confirm") }}
        </v-btn>
        <v-btn color="error" text @click="toggle">
          {{ $t("cancel") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
