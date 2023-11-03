<script lang="ts" setup>
import type * as backend from '@/interfaces/backend'
import { db } from '@/modules/database'
import type { InsertProgram, SelectProgram } from '@/modules/database'

import { upload } from '@/modules/upload'
import type { useFormModalOptions } from '@/hooks/useFormModal'

import exe from '@/assets/exe.png'

const { t } = useI18n()
const store = useMonitorStore()
const { parseError } = useDatabase()
const { success } = useNotify()

const { getIconUrl, refresh } = store
const { filtering, filterList, whiteList } = storeToRefs(store)

const model = ref<SelectProgram>()

const { open, close } = useFormModal(
  computed<useFormModalOptions>(() => ({
    attrs: {
      title: t('program.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('program.name'),
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('program.color'),
          },
        ],
        values: model.value,
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
      }),
      async onConfirm(v, setErrors) {
        try {
          await handleUpdate(v)
        }
        catch (error) {
          return setErrors(parseError(error))
        }
        close()
        success({})
        refresh()
      },
    },
  })))

function showUpdateForm(plan: SelectProgram) {
  model.value = plan
  open()
}

function handleUpdate(program: InsertProgram) {
  return db.program.update(model.value!.id, program)
}

async function handleCreateProgram(program: backend.Program) {
  const { name, path, icon } = program
  const color = randomColor()
  const index = filterList.value.findIndex(i => i.path == path)
  filterList.value.splice(index, 1)
  const src = await upload(`${name}.png`, icon.length ? new Uint8Array(icon) : await (await fetch(exe)).arrayBuffer())
  await db.program.insert({
    name,
    path,
    icon: src,
    color,
  })
}

async function handleSelect() {
  await Promise.all(filterList.value.filter(i => i.checked).map(handleCreateProgram))
  filtering.value = false
  await refresh()
  success({})
}

async function handleRemove(program: SelectProgram) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      async onConfirm() {
        await db.program.removeRelation(program.id)
        close()
        success({})
        refresh()
      },
    },
  })
  open()
}

function showFilterDialog() {
  filtering.value = true
}

refresh()
</script>

<template>
  <div h-full>
    <div v-if="whiteList.length" grid grid-cols-3 gap-6 p-4>
      <div
        v-for="program in whiteList" :key="program.id"
        p-4 flex space-x-4 items-center
        rounded-2
        bg-white
        shadow-lg
        hover:shadow-xl
        transition-shadow
      >
        <img :src="program.icon" width="32" height="32" object-contain>
        <div flex-1 min-w-0 space-y-2>
          <div flex justify-between>
            <div :title="program.path">
              {{ program.name }}
            </div>
            <div
              w-3 h-3 rounded-full mr-1
              :style="{
                backgroundColor: program.color,
              }"
            />
          </div>
          <div flex class="group">
            <div>{{ formatHHmmss(program.totalTime) }}</div>
            <div flex-1 />
            <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2>
              <v-tooltip :text="$t('button.update')" location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:file-edit-outline text-5 cursor-pointer v-bind="props" @click.stop="showUpdateForm(program)" />
                </template>
              </v-tooltip>
              <v-tooltip :text="$t('button.remove')" location="bottom">
                <template #activator="{ props }">
                  <div i-mdi:delete-outline text-5 cursor-pointer v-bind="props" @click.stop="handleRemove(program)" />
                </template>
              </v-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <a-empty v-else h-full flex flex-col justify-center /> -->
    <more-menu>
      <v-list>
        <v-list-item value="monitor.filterProgram">
          <v-list-item-title @click="showFilterDialog">
            {{ $t('monitor.filterProgram') }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </more-menu>
    <v-dialog
      v-model="filtering"
      width="600"
      height="400"
    >
      <v-card>
        <v-card-title>{{ $t('monitor.filterProgram') }}</v-card-title>
        <v-card-text overflow-y-auto>
          <template v-if="filterList.length">
            <div v-for="program in filterList" :key="program.path" flex space-x-4 mb-4>
              <div>
                <v-checkbox v-model="program.checked" />
              </div>
              <div
                flex-1 min-w-0
                p-4 flex space-x-4 items-center
                rounded-2
                bg-white
                shadow-lg
                hover:shadow-xl
                transition-shadow
              >
                <img :src="getIconUrl(program.path)" width="32" height="32" object-contain>
                <div flex-1 min-w-0>
                  <div>
                    {{ program.name }}
                  </div>
                  <div truncate :title="program.path">
                    {{ program.path }}
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- <a-empty h-full flex flex-col justify-center :description="$t('monitor.switchWindowTip')" /> -->
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="handleSelect">
            {{ $t('modal.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
