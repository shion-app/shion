<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'
import { readDir } from '@tauri-apps/plugin-fs'

const extensionConfig = useExtensionStore()

const { config } = storeToRefs(extensionConfig)

const { t } = useI18n()
const { warning } = useNotify()

function removeRow(path: string) {
  const index = config.value.obsidian.workspace.indexOf(path)
  if (index != -1)
    config.value.obsidian.workspace.splice(index, 1)
}

async function openDirectoryDialog() {
  const selected = await open({
    directory: true,
  })
  if (selected) {
    const index = config.value.obsidian.workspace.indexOf(selected)
    if (index != -1) {
      return warning({
        text: t('extension.tip.obsidian.duplicate'),
      })
    }
    const list = await readDir(selected)
    const invalid = !list.find(i => i.isDirectory && i.name == '.obsidian')
    if (invalid) {
      return warning({
        text: t('extension.tip.obsidian.invalid'),
      })
    }
    config.value.obsidian.workspace.push(selected)
  }
}
</script>

<template>
  <v-tabs-window-item value="obsidian">
    <v-card flat>
      <v-card-text class="py-0!">
        <v-list lines="two">
          <v-list-item :title="$t('extension.obsidian.workspace')">
            <v-list-item-subtitle>
              {{ $t('extension.desc.obsidian.workspace') }}
            </v-list-item-subtitle>
            <div my-2 space-y-2>
              <v-text-field
                v-for="text, index in config.obsidian.workspace" :key="text"
                v-model="config.obsidian.workspace[index]" hide-details readonly density="comfortable"
                variant="outlined"
              >
                <template #append>
                  <tooltip-button
                    class="mr-2"
                    location="bottom" :tooltip="$t('button.remove')" icon="mdi-trash-can"
                    @click="removeRow(text)"
                  />
                </template>
                <v-tooltip :text="text" location="bottom" activator="parent" />
              </v-text-field>
              <v-btn mt-2 color="primary" @click="openDirectoryDialog">
                {{ $t('button.add') }}
              </v-btn>
            </div>
          </v-list-item>
          <v-list-item :title="$t('extension.obsidian.created')">
            <v-list-item-subtitle>{{ $t('extension.desc.obsidian.created') }}</v-list-item-subtitle>
            <v-text-field
              v-model="config.obsidian.created" variant="outlined" hide-details class="mt-2"
              density="comfortable"
            />
          </v-list-item>
          <v-list-item :title="$t('extension.obsidian.updated')">
            <v-list-item-subtitle>{{ $t('extension.desc.obsidian.updated') }}</v-list-item-subtitle>
            <v-text-field
              v-model="config.obsidian.updated" variant="outlined" hide-details class="mt-2"
              density="comfortable"
            />
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-tabs-window-item>
</template>
