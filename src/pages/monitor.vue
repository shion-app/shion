<script lang="ts" setup>
import type * as backend from '@/interfaces/backend'
import { db } from '@/modules/database'
import type { InsertProgram } from '@/modules/database'

import { upload } from '@/modules/upload'

import exe from '@/assets/exe.png'
import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'

type ProgramForm = Pick<InsertProgram, 'name' | 'color'>

const { t } = useI18n()
const store = useMonitorStore()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()

const { getIconUrl, refresh } = store
const { filtering, filterList, whiteList } = storeToRefs(store)

const { items, select, selectedList } = useGrid(whiteList)

const { setUpdateId, handleUpdate } = buildUpdateFn()

const cardList = computed(() => whiteList.value.map(({ id, name, totalTime, color, icon, selected }) => ({
  id,
  title: name,
  totalTime,
  color,
  prependImgUrl: icon,
  selected,
})))

const { open, close, setModelValue } = useFormModal<ProgramForm>(
  () => ({
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
          return setErrors(parseFieldsError(error))
        }
        close()
        success({})
        refresh()
      },
    },
  }))

const { open: openBatchRemoveModal } = useConfirmDeleteModal(async () => {
  await Promise.all(selectedList.value.map(id => db.program.removeRelation(id)))
  success({})
  refresh()
})

const { setRemoveId, remove } = buildRemoveFn()
const { open: openRemoveModal } = useConfirmDeleteModal(remove)

function handleRemove(id: number) {
  setRemoveId(id)
  openRemoveModal()
}

function buildRemoveFn() {
  let id = 0
  return {
    setRemoveId: (removeId: number) => {
      id = removeId
    },
    remove: async () => {
      await db.program.removeRelation(id)
      success({})
      refresh()
    },
  }
}

function showUpdateForm(id: number) {
  setUpdateId(id)
  const program = whiteList.value.find(i => i.id == id)
  if (!program)
    return

  setModelValue(program)
  open()
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (program: ProgramForm) => {
      return db.program.update(id, program)
    },
  }
}

async function handleCreateProgram(program: backend.Program) {
  const { name, path, icon } = program
  const color = randomColor()
  const index = filterList.value.findIndex(i => i.path == path)
  filterList.value.splice(index, 1)
  const src = await upload(`${name}.png`, icon.length ? new Uint8Array(icon) : await (await fetch(exe)).arrayBuffer())
  // todo: db event listener
  const { lastInsertId } = await db.program.insert({
    name,
    path,
    icon: src,
    color,
  })
  await db.program.update(lastInsertId, {
    sort: lastInsertId,
  })
}

async function handleSelect() {
  await Promise.all(filterList.value.filter(i => i.checked).map(handleCreateProgram))
  filtering.value = false
  await refresh()
  success({})
}

function showFilterDialog() {
  filtering.value = true
}

async function handleGridChange(items: number[]) {
  const programList = items.map((id, index) => {
    const { sort } = whiteList.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => whiteList.value[index].id != i.id)
  await db.program.batchUpdate(programList)
  await refresh()
}

refresh()
</script>

<template>
  <grid
    v-if="whiteList.length"
    :items="items"
    :component-props="cardList"
    :options="{ cellHeight: 120 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <time-card
        v-bind="componentProps"
        @update="showUpdateForm"
        @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)"
      />
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal" />
      <v-list-item value="monitor.filterProgram" :title="$t('monitor.filterProgram')" append-icon="mdi-filter-outline" @click="showFilterDialog" />
    </v-list>
  </more-menu>
  <v-dialog
    v-model="filtering"
    width="550"
    max-height="400"
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
        <empty v-else :desc="$t('monitor.switchWindowTip')" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="handleSelect">
          {{ $t('modal.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
